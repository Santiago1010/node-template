const { dataFlags } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createFlagSchema = {
  name: commonSchemas.stringSchema('name', 'body', { required: true, minSecurityLevel: 1, maxLength: 100 }),
  emoji: commonSchemas.stringSchema('emoji', 'body', { required: true, minSecurityLevel: 1, maxLength: 5 }),
  location: commonSchemas.stringSchema('location', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  flat2d: commonSchemas.stringSchema('flat2d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  rounded2d: commonSchemas.stringSchema('rounded2d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  wave2d: commonSchemas.stringSchema('wave2d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  flat3d: commonSchemas.stringSchema('flat3d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  rounded3d: commonSchemas.stringSchema('rounded3d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  wave3d: commonSchemas.stringSchema('wave3d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  // Add any additional body parameters here
};

const updateFlagsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: dataFlags, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListFlagsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(dataFlags),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getFlagDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: dataFlags,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(dataFlags),
  // Add any additional query parameters here
};

const updateFlagSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataFlags,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  emoji: commonSchemas.stringSchema('emoji', 'body', { required: false, minSecurityLevel: 1, maxLength: 5 }),
  location: commonSchemas.stringSchema('location', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  flat2d: commonSchemas.stringSchema('flat2d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  rounded2d: commonSchemas.stringSchema('rounded2d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  wave2d: commonSchemas.stringSchema('wave2d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  flat3d: commonSchemas.stringSchema('flat3d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  rounded3d: commonSchemas.stringSchema('rounded3d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  wave3d: commonSchemas.stringSchema('wave3d', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  // Add any additional body parameters here
};

const deleteFlagSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataFlags,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createFlagSchema,
  updateFlagsStatusSchema,
  getListFlagsSchema,
  getFlagDetailsSchema,
  updateFlagSchema,
  deleteFlagSchema,
};
