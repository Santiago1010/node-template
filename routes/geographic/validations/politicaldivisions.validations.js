const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createPolitical_divisionSchema = {
  countryId: databaseSchemas.idSchema('countryId', 'body', { model: 'geoCountries', required: true }),
  capitalId: commonSchemas.numberSchema('capitalId', 'body', {
    required: false,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  name: commonSchemas.objectSchema('name', 'body', { required: true }),
  denomination: commonSchemas.stringSchema('denomination', 'body', { required: true }),
  // Add any additional body parameters here
};

const updatePoliticaldivisionsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'geoPoliticalDivisions', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListPoliticaldivisionsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('geoPoliticalDivisions'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  countryId: databaseSchemas.idSchema('countryId', 'query', { model: 'geoCountries', required: false }),
  // Add any additional query parameters here
};

const getPolitical_divisionDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'geoPoliticalDivisions',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('geoPoliticalDivisions'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  countryId: databaseSchemas.idSchema('countryId', 'query', { model: 'geoCountries', required: false }),
  // Add any additional detail's query parameters here
};

const updatePolitical_divisionSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoPoliticalDivisions', required: true, paranoid: false }),
  countryId: databaseSchemas.idSchema('countryId', 'body', { model: 'geoCountries', required: false }),
  capitalId: commonSchemas.numberSchema('capitalId', 'body', {
    required: false,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  name: commonSchemas.objectSchema('name', 'body', { required: false }),
  denomination: commonSchemas.stringSchema('denomination', 'body', { required: false }),
  // Add any additional body parameters here
};

const deletePolitical_divisionSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoPoliticalDivisions', required: true, paranoid: false }),
};

module.exports = {
  createPolitical_divisionSchema,
  updatePoliticaldivisionsStatusSchema,
  getListPoliticaldivisionsSchema,
  getPolitical_divisionDetailsSchema,
  updatePolitical_divisionSchema,
  deletePolitical_divisionSchema,
};
