const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createCurrencySchema = {
  name: commonSchemas.objectSchema('name', 'body', { required: true }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', { required: true, maxLength: 15 }),
  symbol: commonSchemas.stringSchema('symbol', 'body', { required: true, maxLength: 10 }),
  // Add any additional body parameters here
};

const updateCurrenciesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'dataCurrencies', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListCurrenciesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('dataCurrencies'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  // Add any additional query parameters here
};

const getCurrencyDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'dataCurrencies',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('dataCurrencies'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateCurrencySchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'dataCurrencies', required: true, paranoid: false }),
  name: commonSchemas.objectSchema('name', 'body', { required: false }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', { required: false, maxLength: 15 }),
  symbol: commonSchemas.stringSchema('symbol', 'body', { required: false, maxLength: 10 }),
  // Add any additional body parameters here
};

const deleteCurrencySchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'dataCurrencies', required: true, paranoid: false }),
};

module.exports = {
  createCurrencySchema,
  updateCurrenciesStatusSchema,
  getListCurrenciesSchema,
  getCurrencyDetailsSchema,
  updateCurrencySchema,
  deleteCurrencySchema,
};
