const { configSecurityLevels } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createSecurity_levelSchema = {
  slug: commonSchemas.stringSchema('slug', 'body', { required: true, minSecurityLevel: 1, maxLength: 100 }),
  name: commonSchemas.objectSchema('name', 'body', { required: true, minSecurityLevel: 1 }),
  priority: commonSchemas.numberSchema('priority', 'body', {
    required: true,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  description: commonSchemas.objectSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const updateSecuritylevelsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: configSecurityLevels,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListSecuritylevelsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configSecurityLevels),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getSecurity_levelDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configSecurityLevels,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(configSecurityLevels),
  // Add any additional query parameters here
};

const updateSecurity_levelSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configSecurityLevels,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  slug: commonSchemas.stringSchema('slug', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  name: commonSchemas.objectSchema('name', 'body', { required: false, minSecurityLevel: 1 }),
  priority: commonSchemas.numberSchema('priority', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  description: commonSchemas.objectSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const deleteSecurity_levelSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configSecurityLevels,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createSecurity_levelSchema,
  updateSecuritylevelsStatusSchema,
  getListSecuritylevelsSchema,
  getSecurity_levelDetailsSchema,
  updateSecurity_levelSchema,
  deleteSecurity_levelSchema,
};
