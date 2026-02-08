const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createTimezoneSchema = {
  continentId: databaseSchemas.idSchema('continentId', 'body', { model: 'geoContinents', required: true }),
  name: commonSchemas.stringSchema('name', 'body', { required: true, maxLength: 50 }),
  utc: commonSchemas.stringSchema('utc', 'body', { required: true, maxLength: 6 }),
  // Add any additional body parameters here
};

const updateTimezonesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'dataTimezones', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListTimezonesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('dataTimezones'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  continentId: databaseSchemas.idSchema('continentId', 'query', { model: 'geoContinents', required: false }),
  // Add any additional query parameters here
};

const getTimezoneDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'dataTimezones',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('dataTimezones'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  continentId: databaseSchemas.idSchema('continentId', 'query', { model: 'geoContinents', required: false }),
  // Add any additional detail's query parameters here
};

const updateTimezoneSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'dataTimezones', required: true, paranoid: false }),
  continentId: databaseSchemas.idSchema('continentId', 'body', { model: 'geoContinents', required: false }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, maxLength: 50 }),
  utc: commonSchemas.stringSchema('utc', 'body', { required: false, maxLength: 6 }),
  // Add any additional body parameters here
};

const deleteTimezoneSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'dataTimezones', required: true, paranoid: false }),
};

module.exports = {
  createTimezoneSchema,
  updateTimezonesStatusSchema,
  getListTimezonesSchema,
  getTimezoneDetailsSchema,
  updateTimezoneSchema,
  deleteTimezoneSchema,
};
