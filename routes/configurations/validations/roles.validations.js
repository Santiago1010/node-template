const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createRoleSchema = {
  name: commonSchemas.stringSchema('name', 'body', { required: true, maxLength: 100 }),
  target: commonSchemas.inSchema('target', ['employee', 'customer'], 'body', { required: false }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: false }),
  // Add any additional body parameters here
};

const updateRolesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'configRoles', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListRolesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('configRoles'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  target: commonSchemas.inSchema('target', ['employee', 'customer'], 'query', { required: false }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'query', { required: false }),
  // Add any additional query parameters here
};

const getRoleDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'configRoles',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('configRoles'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  target: commonSchemas.inSchema('target', ['employee', 'customer'], 'query', { required: false }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateRoleSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configRoles', required: true, paranoid: false }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, maxLength: 100 }),
  target: commonSchemas.inSchema('target', ['employee', 'customer'], 'body', { required: false }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: false }),
  // Add any additional body parameters here
};

const deleteRoleSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configRoles', required: true, paranoid: false }),
};

module.exports = {
  createRoleSchema,
  updateRolesStatusSchema,
  getListRolesSchema,
  getRoleDetailsSchema,
  updateRoleSchema,
  deleteRoleSchema,
};
