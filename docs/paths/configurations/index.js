const endpoints = require('./endpoints.docs');
const hosts = require('./hosts.docs');

module.exports = {
  '/config/endpoints': { ...endpoints.basePath },
  '/config/endpoints/{id}': { ...endpoints.pathWithId },
  '/config/hosts': { ...hosts.basePath },
  '/config/hosts/{id}': { ...hosts.pathWithId },
};
