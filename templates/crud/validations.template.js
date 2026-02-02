const { {{MAIN_MODEL}}{{MORE_MODELS}} } = require('../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const {{CREATE_METHOD}}Schema = {
  // Add any additional body parameters here
};

const {{UPDATE_STATUS_METHOD}}Schema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: {{MAIN_MODEL}}, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const {{LIST_METHOD}}Schema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas({{MAIN_MODEL}}),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const {{DETAILS_METHOD}}Schema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: {{MAIN_MODEL}},
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas({{MAIN_MODEL}}),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional detail's query parameters here
};

const {{UPDATE_METHOD}}Schema = {
  id: databaseSchemas.idSchema('id', 'params', { model: {{MAIN_MODEL}}, required: true, minSecurityLevel: 1, paranoid: false }),
  active: commonSchemas.booleanSchema('active', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const {{DELETE_METHOD}}Schema = {
  id: databaseSchemas.idSchema('id', 'params', { model: {{MAIN_MODEL}}, required: true, minSecurityLevel: 1, paranoid: false }),
};

module.exports = { {{CREATE_METHOD}}Schema, {{UPDATE_STATUS_METHOD}}Schema, {{LIST_METHOD}}Schema, {{DETAILS_METHOD}}Schema, {{UPDATE_METHOD}}Schema, {{DELETE_METHOD}}Schema };
