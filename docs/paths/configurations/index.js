const endpoints = require('./endpoints.docs');
const hosts = require('./hosts.docs');
const pages = require('./pages.docs');
const roles = require('./roles.docs');
const scopes = require('./scopes.docs');
const shorteners = require('./shorteners.docs');

module.exports = {
  '/config/endpoints': { ...endpoints.basePath },
  '/config/endpoints/{id}': { ...endpoints.pathWithId },
  '/config/hosts': { ...hosts.basePath },
  '/config/hosts/{id}': { ...hosts.pathWithId },
  '/config/pages': { ...pages.basePath },
  '/config/pages/{id}': { ...pages.pathWithId },
  '/config/roles': { ...roles.basePath },
  '/config/roles/{id}': { ...roles.pathWithId },
  '/config/scopes': { ...scopes.basePath },
  '/config/scopes/{id}': { ...scopes.pathWithId },
  '/config/shorteners': { ...shorteners.basePath },
  '/config/shorteners/{id}': { ...shorteners.pathWithId },
};
