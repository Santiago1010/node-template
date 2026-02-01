const { dataTimezones } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createTimezoneSchema = {
  idContinent: commonSchemas.numberSchema('idContinent', 'body', {
    required: true,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: true, minSecurityLevel: 1, maxLength: 50 }),
  utc: commonSchemas.stringSchema('utc', 'body', { required: true, minSecurityLevel: 1, maxLength: 6 }),
  // Add any additional body parameters here
};

const updateTimezonesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: dataTimezones,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListTimezonesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(dataTimezones),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getTimezoneDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: dataTimezones,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(dataTimezones),
  // Add any additional query parameters here
};

const updateTimezoneSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataTimezones,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  idContinent: commonSchemas.numberSchema('idContinent', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 50 }),
  utc: commonSchemas.stringSchema('utc', 'body', { required: false, minSecurityLevel: 1, maxLength: 6 }),
  // Add any additional body parameters here
};

const deleteTimezoneSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataTimezones,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createTimezoneSchema,
  updateTimezonesStatusSchema,
  getListTimezonesSchema,
  getTimezoneDetailsSchema,
  updateTimezoneSchema,
  deleteTimezoneSchema,
};
