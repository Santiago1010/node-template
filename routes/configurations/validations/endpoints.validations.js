const { configEndpoints } = require('../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createEndpointSchema = {
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'body', {
    required: true,
    minSecurityLevel: 1,
  }),
  version: commonSchemas.stringSchema('version', 'body', { required: true, minSecurityLevel: 1, maxLength: 10 }),
  endpointGroup: commonSchemas.stringSchema('endpointGroup', 'body', {
    required: true,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  path: commonSchemas.stringSchema('path', 'body', { required: true, minSecurityLevel: 1, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional body parameters here
};

const updateEndpointsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: configEndpoints,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListEndpointsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configEndpoints),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional query parameters here
};

const getEndpointDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configEndpoints,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas(configEndpoints),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional detail's query parameters here
};

const updateEndpointSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configEndpoints,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  version: commonSchemas.stringSchema('version', 'body', { required: false, minSecurityLevel: 1, maxLength: 10 }),
  endpointGroup: commonSchemas.stringSchema('endpointGroup', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  path: commonSchemas.stringSchema('path', 'body', { required: false, minSecurityLevel: 1, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional body parameters here
};

const deleteEndpointSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configEndpoints,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createEndpointSchema,
  updateEndpointsStatusSchema,
  getListEndpointsSchema,
  getEndpointDetailsSchema,
  updateEndpointSchema,
  deleteEndpointSchema,
};
