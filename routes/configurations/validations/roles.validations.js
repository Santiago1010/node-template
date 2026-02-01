const { configRoles, configSecurityLevels } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createRoleSchema = {
  securityLevelId: databaseSchemas.idSchema('securityLevelId', 'body', {
    model: configSecurityLevels,
    required: true,
    minSecurityLevel: 1,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: true, minSecurityLevel: 1, maxLength: 100 }),
  target: commonSchemas.inSchema('target', ['employee', 'customer'], 'body', { required: false, minSecurityLevel: 1 }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const updateRolesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: configRoles, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListRolesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configRoles),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  securityLevelId: databaseSchemas.idSchema('securityLevelId', 'query', {
    model: configSecurityLevels,
    required: false,
    minSecurityLevel: 1,
  }),
  target: commonSchemas.inSchema('target', ['employee', 'customer'], 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getRoleDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configRoles,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(configRoles),
  // Add any additional query parameters here
};

const updateRoleSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configRoles,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  securityLevelId: databaseSchemas.idSchema('securityLevelId', 'body', {
    model: configSecurityLevels,
    required: false,
    minSecurityLevel: 1,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  target: commonSchemas.inSchema('target', ['employee', 'customer'], 'body', { required: false, minSecurityLevel: 1 }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const deleteRoleSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configRoles,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createRoleSchema,
  updateRolesStatusSchema,
  getListRolesSchema,
  getRoleDetailsSchema,
  updateRoleSchema,
  deleteRoleSchema,
};
