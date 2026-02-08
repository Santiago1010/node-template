const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createPageSchema = {
  hostId: databaseSchemas.idSchema('hostId', 'body', { model: 'configHosts', required: true }),
  pageId: databaseSchemas.idSchema('pageId', 'body', { model: 'configPages', required: false }),
  name: commonSchemas.stringSchema('name', 'body', { required: true, maxLength: 100 }),
  path: commonSchemas.stringSchema('path', 'body', { required: true, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false }),
  level: commonSchemas.numberSchema('level', 'body', { required: false, minValue: -128, maxValue: 127 }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'body', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'body', { required: false }),
  // Add any additional body parameters here
};

const updatePagesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'configPages', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListPagesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('configPages'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  hostId: databaseSchemas.idSchema('hostId', 'query', { model: 'configHosts', required: false }),
  pageId: databaseSchemas.idSchema('pageId', 'query', { model: 'configPages', required: false }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'query', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'query', { required: false }),
  // Add any additional query parameters here
};

const getPageDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'configPages',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('configPages'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  hostId: databaseSchemas.idSchema('hostId', 'query', { model: 'configHosts', required: false }),
  pageId: databaseSchemas.idSchema('pageId', 'query', { model: 'configPages', required: false }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'query', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updatePageSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configPages', required: true, paranoid: false }),
  hostId: databaseSchemas.idSchema('hostId', 'body', { model: 'configHosts', required: false }),
  pageId: databaseSchemas.idSchema('pageId', 'body', { model: 'configPages', required: false }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, maxLength: 100 }),
  path: commonSchemas.stringSchema('path', 'body', { required: false, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false }),
  level: commonSchemas.numberSchema('level', 'body', { required: false, minValue: -128, maxValue: 127 }),
  requiresAuthorization: commonSchemas.booleanSchema('requiresAuthorization', 'body', { required: false }),
  hasSensitiveInformation: commonSchemas.booleanSchema('hasSensitiveInformation', 'body', { required: false }),
  // Add any additional body parameters here
};

const deletePageSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configPages', required: true, paranoid: false }),
};

module.exports = {
  createPageSchema,
  updatePagesStatusSchema,
  getListPagesSchema,
  getPageDetailsSchema,
  updatePageSchema,
  deletePageSchema,
};
