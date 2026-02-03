const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createEndpointSchema = {
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'body', {
    required: true,
  }),
  version: commonSchemas.stringSchema('version', 'body', { required: true, maxLength: 10 }),
  endpointGroup: commonSchemas.stringSchema('endpointGroup', 'body', { required: true, maxLength: 100 }),
  path: commonSchemas.stringSchema('path', 'body', { required: true, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'body', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'body', { required: false }),
  // Add any additional body parameters here
};

const updateEndpointsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'configEndpoints', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListEndpointsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('configEndpoints'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'query', {
    required: false,
  }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'query', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'query', { required: false }),
  // Add any additional query parameters here
};

const getEndpointDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'configEndpoints',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('configEndpoints'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'query', {
    required: false,
  }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'query', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateEndpointSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configEndpoints', required: true, paranoid: false }),
  method: commonSchemas.inSchema('method', ['post', 'get', 'put', 'patch', 'delete', 'options'], 'body', {
    required: false,
  }),
  version: commonSchemas.stringSchema('version', 'body', { required: false, maxLength: 10 }),
  endpointGroup: commonSchemas.stringSchema('endpointGroup', 'body', { required: false, maxLength: 100 }),
  path: commonSchemas.stringSchema('path', 'body', { required: false, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'body', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'body', { required: false }),
  // Add any additional body parameters here
};

const deleteEndpointSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configEndpoints', required: true, paranoid: false }),
};

module.exports = {
  createEndpointSchema,
  updateEndpointsStatusSchema,
  getListEndpointsSchema,
  getEndpointDetailsSchema,
  updateEndpointSchema,
  deleteEndpointSchema,
};
