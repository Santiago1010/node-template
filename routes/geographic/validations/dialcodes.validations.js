const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createDial_codeSchema = {
  countryId: databaseSchemas.idSchema('countryId', 'body', { model: 'geoCountries', required: true }),
  code: commonSchemas.stringSchema('code', 'body', { required: true, maxLength: 10 }),
  mask: commonSchemas.stringSchema('mask', 'body', { required: true, maxLength: 50 }),
  // Add any additional body parameters here
};

const updateDialcodesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'geoDialCodes', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListDialcodesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('geoDialCodes'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  countryId: databaseSchemas.idSchema('countryId', 'query', { model: 'geoCountries', required: false }),
  // Add any additional query parameters here
};

const getDial_codeDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'geoDialCodes',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('geoDialCodes'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  countryId: databaseSchemas.idSchema('countryId', 'query', { model: 'geoCountries', required: false }),
  // Add any additional detail's query parameters here
};

const updateDial_codeSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoDialCodes', required: true, paranoid: false }),
  countryId: databaseSchemas.idSchema('countryId', 'body', { model: 'geoCountries', required: false }),
  code: commonSchemas.stringSchema('code', 'body', { required: false, maxLength: 10 }),
  mask: commonSchemas.stringSchema('mask', 'body', { required: false, maxLength: 50 }),
  // Add any additional body parameters here
};

const deleteDial_codeSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoDialCodes', required: true, paranoid: false }),
};

module.exports = {
  createDial_codeSchema,
  updateDialcodesStatusSchema,
  getListDialcodesSchema,
  getDial_codeDetailsSchema,
  updateDial_codeSchema,
  deleteDial_codeSchema,
};
