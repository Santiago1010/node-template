const { geoPoliticalDivisions } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createPolitical_divisionSchema = {
,
  // Add any additional body parameters here
};

const updatePoliticaldivisionsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: geoPoliticalDivisions,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListPoliticaldivisionsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(geoPoliticalDivisions),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getPolitical_divisionDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: geoPoliticalDivisions,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(geoPoliticalDivisions),
  // Add any additional query parameters here
};

const updatePolitical_divisionSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: geoPoliticalDivisions, required: true, minSecurityLevel: 1, paranoid: false }),
,
  // Add any additional body parameters here
};

const deletePolitical_divisionSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoPoliticalDivisions,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createPolitical_divisionSchema,
  updatePoliticaldivisionsStatusSchema,
  getListPoliticaldivisionsSchema,
  getPolitical_divisionDetailsSchema,
  updatePolitical_divisionSchema,
  deletePolitical_divisionSchema,
};
