const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createCitySchema = {
  subDivisionId: databaseSchemas.idSchema('subDivisionId', 'body', { model: 'geoPoliticalDivisions', required: true }),
  timezoneId: databaseSchemas.idSchema('timezoneId', 'body', { model: 'dataTimezones', required: true }),
  name: commonSchemas.stringSchema('name', 'body', { required: true, maxLength: 100 }),
  // Add any additional body parameters here
};

const updateCitiesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'geoCities', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListCitiesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('geoCities'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  subDivisionId: databaseSchemas.idSchema('subDivisionId', 'query', {
    model: 'geoPoliticalDivisions',
    required: false,
  }),
  timezoneId: databaseSchemas.idSchema('timezoneId', 'query', { model: 'dataTimezones', required: false }),
  // Add any additional query parameters here
};

const getCityDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'geoCities',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('geoCities'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  subDivisionId: databaseSchemas.idSchema('subDivisionId', 'query', {
    model: 'geoPoliticalDivisions',
    required: false,
  }),
  timezoneId: databaseSchemas.idSchema('timezoneId', 'query', { model: 'dataTimezones', required: false }),
  // Add any additional detail's query parameters here
};

const updateCitySchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoCities', required: true, paranoid: false }),
  subDivisionId: databaseSchemas.idSchema('subDivisionId', 'body', { model: 'geoPoliticalDivisions', required: false }),
  timezoneId: databaseSchemas.idSchema('timezoneId', 'body', { model: 'dataTimezones', required: false }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, maxLength: 100 }),
  // Add any additional body parameters here
};

const deleteCitySchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoCities', required: true, paranoid: false }),
};

module.exports = {
  createCitySchema,
  updateCitiesStatusSchema,
  getListCitiesSchema,
  getCityDetailsSchema,
  updateCitySchema,
  deleteCitySchema,
};
