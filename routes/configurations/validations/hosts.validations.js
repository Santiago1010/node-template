const { configHosts } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createHostSchema = {
  url: commonSchemas.linkSchema('url', 'body', { required: true, minSecurityLevel: 1 }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const updateHostsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: configHosts, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListHostsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configHosts),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getHostDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configHosts,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(configHosts),
  // Add any additional query parameters here
};

const updateHostSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configHosts,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  url: commonSchemas.linkSchema('url', 'body', { required: false, minSecurityLevel: 1 }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const deleteHostSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configHosts,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createHostSchema,
  updateHostsStatusSchema,
  getListHostsSchema,
  getHostDetailsSchema,
  updateHostSchema,
  deleteHostSchema,
};
