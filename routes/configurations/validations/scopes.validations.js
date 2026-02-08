const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createScopeSchema = {
  name: commonSchemas.stringSchema('name', 'body', { required: true, maxLength: 100 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false }),
  isSelectable: commonSchemas.booleanSchema('isSelectable', 'body', { required: false }),
  // Add any additional body parameters here
};

const updateScopesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'configScopes', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListScopesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('configScopes'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  isSelectable: commonSchemas.booleanSchema('isSelectable', 'query', { required: false }),
  // Add any additional query parameters here
};

const getScopeDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'configScopes',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('configScopes'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  isSelectable: commonSchemas.booleanSchema('isSelectable', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateScopeSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configScopes', required: true, paranoid: false }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, maxLength: 100 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false }),
  isSelectable: commonSchemas.booleanSchema('isSelectable', 'body', { required: false }),
  // Add any additional body parameters here
};

const deleteScopeSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configScopes', required: true, paranoid: false }),
};

module.exports = {
  createScopeSchema,
  updateScopesStatusSchema,
  getListScopesSchema,
  getScopeDetailsSchema,
  updateScopeSchema,
  deleteScopeSchema,
};
