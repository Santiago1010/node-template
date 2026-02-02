const endpoints = require('./endpoints.docs');

module.exports = {
  '/config/endpoints': { ...endpoints.basePath },
  '/config/endpoints/{id}': { ...endpoints.pathWithId },
};
