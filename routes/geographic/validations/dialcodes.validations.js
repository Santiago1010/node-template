const { geoDialCodes, geoCountries } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createDial_codeSchema = {
  countryId: databaseSchemas.idSchema('countryId', 'body', {
    model: geoCountries,
    required: true,
    minSecurityLevel: 1,
  }),
  code: commonSchemas.stringSchema('code', 'body', { required: true, minSecurityLevel: 1, maxLength: 10 }),
  mask: commonSchemas.stringSchema('mask', 'body', { required: true, minSecurityLevel: 1, maxLength: 50 }),
  // Add any additional body parameters here
};

const updateDialcodesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: geoDialCodes, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListDialcodesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(geoDialCodes),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  countryId: databaseSchemas.idSchema('countryId', 'query', {
    model: geoCountries,
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional query parameters here
};

const getDial_codeDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: geoDialCodes,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(geoDialCodes),
  // Add any additional query parameters here
};

const updateDial_codeSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoDialCodes,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  countryId: databaseSchemas.idSchema('countryId', 'body', {
    model: geoCountries,
    required: false,
    minSecurityLevel: 1,
  }),
  code: commonSchemas.stringSchema('code', 'body', { required: false, minSecurityLevel: 1, maxLength: 10 }),
  mask: commonSchemas.stringSchema('mask', 'body', { required: false, minSecurityLevel: 1, maxLength: 50 }),
  // Add any additional body parameters here
};

const deleteDial_codeSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoDialCodes,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createDial_codeSchema,
  updateDialcodesStatusSchema,
  getListDialcodesSchema,
  getDial_codeDetailsSchema,
  updateDial_codeSchema,
  deleteDial_codeSchema,
};
