const { configHosts } = require('../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createHostSchema = {
  url: commonSchemas.linkSchema('url', 'body', { required: true }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: true }),
  // Add any additional body parameters here
};

const updateHostsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: configHosts, required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListHostsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configHosts),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'query', { required: false }),
  // Add any additional query parameters here
};

const getHostDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configHosts,
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas(configHosts),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateHostSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: configHosts, required: true, paranoid: false }),
  url: commonSchemas.linkSchema('url', 'body', { required: false }),
  isDefault: commonSchemas.booleanSchema('isDefault', 'body', { required: false }),
  // Add any additional body parameters here
};

const deleteHostSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: configHosts, required: true, paranoid: false }),
};

module.exports = {
  createHostSchema,
  updateHostsStatusSchema,
  getListHostsSchema,
  getHostDetailsSchema,
  updateHostSchema,
  deleteHostSchema,
};
