const { dataCurrencies } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createCurrencySchema = {
  name: commonSchemas.objectSchema('name', 'body', { required: true, minSecurityLevel: 1 }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', {
    required: true,
    minSecurityLevel: 1,
    maxLength: 15,
  }),
  symbol: commonSchemas.stringSchema('symbol', 'body', { required: true, minSecurityLevel: 1, maxLength: 10 }),
  // Add any additional body parameters here
};

const updateCurrenciesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: dataCurrencies,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListCurrenciesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(dataCurrencies),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getCurrencyDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: dataCurrencies,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(dataCurrencies),
  // Add any additional query parameters here
};

const updateCurrencySchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataCurrencies,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  name: commonSchemas.objectSchema('name', 'body', { required: false, minSecurityLevel: 1 }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 15,
  }),
  symbol: commonSchemas.stringSchema('symbol', 'body', { required: false, minSecurityLevel: 1, maxLength: 10 }),
  // Add any additional body parameters here
};

const deleteCurrencySchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataCurrencies,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createCurrencySchema,
  updateCurrenciesStatusSchema,
  getListCurrenciesSchema,
  getCurrencyDetailsSchema,
  updateCurrencySchema,
  deleteCurrencySchema,
};
