const { configEndpoints } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

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
  requiresAuthorization: commonSchemas.numberSchema('requiresAuthorization', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  hasSensitiveInformation: commonSchemas.numberSchema('hasSensitiveInformation', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
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
  // Add any additional query parameters here
};

const getEndpointDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configEndpoints,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(configEndpoints),
  // Add any additional query parameters here
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
  requiresAuthorization: commonSchemas.numberSchema('requiresAuthorization', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  hasSensitiveInformation: commonSchemas.numberSchema('hasSensitiveInformation', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
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
