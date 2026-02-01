const { geoCities } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createCitySchema = {
  idSubDivision: commonSchemas.numberSchema('idSubDivision', 'body', {
    required: true,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  idTimezone: commonSchemas.numberSchema('idTimezone', 'body', {
    required: true,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: true, minSecurityLevel: 1, maxLength: 100 }),
  // Add any additional body parameters here
};

const updateCitiesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: geoCities, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListCitiesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(geoCities),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getCityDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: geoCities,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(geoCities),
  // Add any additional query parameters here
};

const updateCitySchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoCities,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  idSubDivision: commonSchemas.numberSchema('idSubDivision', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  idTimezone: commonSchemas.numberSchema('idTimezone', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  // Add any additional body parameters here
};

const deleteCitySchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoCities,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createCitySchema,
  updateCitiesStatusSchema,
  getListCitiesSchema,
  getCityDetailsSchema,
  updateCitySchema,
  deleteCitySchema,
};
