const { geoCountries } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createCountrySchema = {
  idRegion: commonSchemas.numberSchema('idRegion', 'body', {
    required: true,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  idCapital: commonSchemas.numberSchema('idCapital', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  idFlag: commonSchemas.numberSchema('idFlag', 'body', {
    required: true,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  popularName: commonSchemas.objectSchema('popularName', 'body', { required: true, minSecurityLevel: 1 }),
  officialName: commonSchemas.objectSchema('officialName', 'body', { required: true, minSecurityLevel: 1 }),
  abbreviation: commonSchemas.objectSchema('abbreviation', 'body', { required: true, minSecurityLevel: 1 }),
  surfaceArea: commonSchemas.stringSchema('surfaceArea', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 15,
  }),
  tld: commonSchemas.stringSchema('tld', 'body', { required: true, minSecurityLevel: 1, maxLength: 10 }),
  // Add any additional body parameters here
};

const updateCountriesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: geoCountries, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListCountriesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(geoCountries),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getCountryDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: geoCountries,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(geoCountries),
  // Add any additional query parameters here
};

const updateCountrySchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoCountries,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  idRegion: commonSchemas.numberSchema('idRegion', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  idCapital: commonSchemas.numberSchema('idCapital', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  idFlag: commonSchemas.numberSchema('idFlag', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  popularName: commonSchemas.objectSchema('popularName', 'body', { required: false, minSecurityLevel: 1 }),
  officialName: commonSchemas.objectSchema('officialName', 'body', { required: false, minSecurityLevel: 1 }),
  abbreviation: commonSchemas.objectSchema('abbreviation', 'body', { required: false, minSecurityLevel: 1 }),
  surfaceArea: commonSchemas.stringSchema('surfaceArea', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 15,
  }),
  tld: commonSchemas.stringSchema('tld', 'body', { required: false, minSecurityLevel: 1, maxLength: 10 }),
  // Add any additional body parameters here
};

const deleteCountrySchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoCountries,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createCountrySchema,
  updateCountriesStatusSchema,
  getListCountriesSchema,
  getCountryDetailsSchema,
  updateCountrySchema,
  deleteCountrySchema,
};
