const { usrDevices, usrAccounts } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createDeviceSchema = {
  accountId: databaseSchemas.idSchema('accountId', 'body', { model: usrAccounts, required: true, minSecurityLevel: 1 }),
  fingerprint: commonSchemas.stringSchema('fingerprint', 'body', {
    required: true,
    minSecurityLevel: 1,
    maxLength: 64,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 150 }),
  type: commonSchemas.inSchema('type', ['desktop', 'mobile', 'tablet', 'other'], 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  browser: commonSchemas.stringSchema('browser', 'body', { required: false, minSecurityLevel: 1, maxLength: 50 }),
  os: commonSchemas.stringSchema('os', 'body', { required: false, minSecurityLevel: 1, maxLength: 50 }),
  isTrusted: commonSchemas.booleanSchema('isTrusted', 'body', { required: false, minSecurityLevel: 1 }),
  isBlocked: commonSchemas.booleanSchema('isBlocked', 'body', { required: false, minSecurityLevel: 1 }),
  lastIp: commonSchemas.stringSchema('lastIp', 'body', { required: false, minSecurityLevel: 1, maxLength: 45 }),
  lastUsedAt: commonSchemas.dateSchema('lastUsedAt', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const updateDevicesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: usrDevices, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListDevicesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(usrDevices),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  accountId: databaseSchemas.idSchema('accountId', 'query', {
    model: usrAccounts,
    required: false,
    minSecurityLevel: 1,
  }),
  type: commonSchemas.inSchema('type', ['desktop', 'mobile', 'tablet', 'other'], 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional query parameters here
};

const getDeviceDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: usrDevices,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(usrDevices),
  // Add any additional query parameters here
};

const updateDeviceSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrDevices,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  accountId: databaseSchemas.idSchema('accountId', 'body', {
    model: usrAccounts,
    required: false,
    minSecurityLevel: 1,
  }),
  fingerprint: commonSchemas.stringSchema('fingerprint', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 64,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 150 }),
  type: commonSchemas.inSchema('type', ['desktop', 'mobile', 'tablet', 'other'], 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  browser: commonSchemas.stringSchema('browser', 'body', { required: false, minSecurityLevel: 1, maxLength: 50 }),
  os: commonSchemas.stringSchema('os', 'body', { required: false, minSecurityLevel: 1, maxLength: 50 }),
  isTrusted: commonSchemas.booleanSchema('isTrusted', 'body', { required: false, minSecurityLevel: 1 }),
  isBlocked: commonSchemas.booleanSchema('isBlocked', 'body', { required: false, minSecurityLevel: 1 }),
  lastIp: commonSchemas.stringSchema('lastIp', 'body', { required: false, minSecurityLevel: 1, maxLength: 45 }),
  lastUsedAt: commonSchemas.dateSchema('lastUsedAt', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const deleteDeviceSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrDevices,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createDeviceSchema,
  updateDevicesStatusSchema,
  getListDevicesSchema,
  getDeviceDetailsSchema,
  updateDeviceSchema,
  deleteDeviceSchema,
};
