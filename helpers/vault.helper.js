const axios = require('axios');

const config = require('../config/env');
const { cerror } = require('./debug.helper');

const vaultClient = axios.create({
  baseURL: config.vault.address,
  headers: {
    'X-Vault-Token': config.vault.token,
  },
  timeout: 5000,
});

const basePath = `${config.name}/${config.mode}`;

const getSecret = async (path, key = null) => {
  try {
    const fullPath = `v1/secret/data/${basePath}/${path}`;
    const response = await vaultClient.get(fullPath);
    const data = response.data?.data?.data;

    if (!data) {
      throw new Error(`No data found at path: ${path}`);
    }

    return key ? data[key] : data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Secret not found: ${basePath}/${path}`);
    }
    throw new Error(`Vault error: ${error.message}`);
  }
};

const setSecret = async (path, data) => {
  try {
    const fullPath = `v1/secret/data/${basePath}/${path}`;
    await vaultClient.post(fullPath, { data });
    return true;
  } catch (error) {
    throw new Error(`Failed to write secret: ${error.message}`);
  }
};

const deleteSecret = async (path) => {
  try {
    const fullPath = `v1/secret/metadata/${basePath}/${path}`;
    await vaultClient.delete(fullPath);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete secret: ${error.message}`);
  }
};

const listSecrets = async (path = '') => {
  try {
    const fullPath = `v1/secret/metadata/${basePath}/${path}`;
    const response = await vaultClient.request({
      method: 'LIST',
      url: fullPath,
    });
    return response.data?.data?.keys || [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error(`Failed to list secrets: ${error.message}`);
  }
};

const getSecrets = async (paths) => {
  try {
    const promises = paths.map(({ path, key }) => getSecret(path, key).then((value) => ({ path, key, value })));
    const results = await Promise.allSettled(promises);

    return results.reduce((acc, result, _index) => {
      if (result.status === 'fulfilled') {
        const { path, key, value } = result.value;
        const identifier = key || path.split('/').pop();
        acc[identifier] = value;
      }
      return acc;
    }, {});
  } catch (error) {
    throw new Error(`Failed to fetch multiple secrets: ${error.message}`);
  }
};

const healthCheck = async () => {
  try {
    const response = await vaultClient.get('/v1/sys/health');
    return response.status === 200;
  } catch (error) {
    cerror('Vault health check failed', error);
    return false;
  }
};

module.exports = {
  getSecret,
  setSecret,
  deleteSecret,
  listSecrets,
  getSecrets,
  healthCheck,
};
