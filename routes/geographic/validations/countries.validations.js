const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createCountrySchema = {
  regionId: databaseSchemas.idSchema('regionId', 'body', { model: 'geoRegions', required: true }),
  capitalId: commonSchemas.numberSchema('capitalId', 'body', {
    required: false,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  flagId: databaseSchemas.idSchema('flagId', 'body', { model: 'dataFlags', required: true }),
  popularName: commonSchemas.objectSchema('popularName', 'body', { required: true }),
  officialName: commonSchemas.objectSchema('officialName', 'body', { required: true }),
  abbreviation: commonSchemas.objectSchema('abbreviation', 'body', { required: true }),
  tld: commonSchemas.stringSchema('tld', 'body', { required: true, maxLength: 10 }),
  // Add any additional body parameters here
};

const updateCountriesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'geoCountries', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListCountriesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('geoCountries'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  regionId: databaseSchemas.idSchema('regionId', 'query', { model: 'geoRegions', required: false }),
  flagId: databaseSchemas.idSchema('flagId', 'query', { model: 'dataFlags', required: false }),
  // Add any additional query parameters here
};

const getCountryDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'geoCountries',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('geoCountries'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  regionId: databaseSchemas.idSchema('regionId', 'query', { model: 'geoRegions', required: false }),
  flagId: databaseSchemas.idSchema('flagId', 'query', { model: 'dataFlags', required: false }),
  // Add any additional detail's query parameters here
};

const updateCountrySchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoCountries', required: true, paranoid: false }),
  regionId: databaseSchemas.idSchema('regionId', 'body', { model: 'geoRegions', required: false }),
  capitalId: commonSchemas.numberSchema('capitalId', 'body', {
    required: false,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  flagId: databaseSchemas.idSchema('flagId', 'body', { model: 'dataFlags', required: false }),
  popularName: commonSchemas.objectSchema('popularName', 'body', { required: false }),
  officialName: commonSchemas.objectSchema('officialName', 'body', { required: false }),
  abbreviation: commonSchemas.objectSchema('abbreviation', 'body', { required: false }),
  tld: commonSchemas.stringSchema('tld', 'body', { required: false, maxLength: 10 }),
  // Add any additional body parameters here
};

const deleteCountrySchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoCountries', required: true, paranoid: false }),
};

module.exports = {
  createCountrySchema,
  updateCountriesStatusSchema,
  getListCountriesSchema,
  getCountryDetailsSchema,
  updateCountrySchema,
  deleteCountrySchema,
};
