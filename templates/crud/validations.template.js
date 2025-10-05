const { {{MAIN_MODEL}}, {{MORE_MODELS}} } = require('../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createSchema = {
  // Add any additional body parameters here
};

const updateStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: {{MAIN_MODEL}}, required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const listSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas({{MAIN_MODEL}}),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  // Add any additional query parameters here
};

const detailsSchema = {
  identifier: databaseSchemas.validateValueAgainstModel('identifier', 'params', {
    model: {{MAIN_MODEL}},
    required: true,
    paranoid: false,
  }),
  ...filtersSchemas({{MAIN_MODEL}}),
  // Add any additional path parameters here
};

const updateSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: {{MAIN_MODEL}}, required: true, paranoid: false }),
  // Add any additional body parameters here
};

const deleteSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: {{MAIN_MODEL}}, required: true, paranoid: false }),
};

module.exports = { createSchema, updateStatusSchema, listSchema, detailsSchema, updateSchema, deleteSchema };
