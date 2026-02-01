const { configScopes } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createScopeSchema = {
  name: commonSchemas.stringSchema('name', 'body', { required: true, minSecurityLevel: 1, maxLength: 100 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  isSelectable: commonSchemas.booleanSchema('isSelectable', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const updateScopesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: configScopes, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListScopesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configScopes),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getScopeDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configScopes,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(configScopes),
  // Add any additional query parameters here
};

const updateScopeSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configScopes,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  isSelectable: commonSchemas.booleanSchema('isSelectable', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const deleteScopeSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configScopes,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createScopeSchema,
  updateScopesStatusSchema,
  getListScopesSchema,
  getScopeDetailsSchema,
  updateScopeSchema,
  deleteScopeSchema,
};
