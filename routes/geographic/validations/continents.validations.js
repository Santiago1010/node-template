const { geoContinents } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createContinentSchema = {
  name: commonSchemas.objectSchema('name', 'body', { required: true, minSecurityLevel: 1 }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', {
    required: true,
    minSecurityLevel: 1,
    maxLength: 3,
  }),
  surfaceArea: commonSchemas.numberSchema('surfaceArea', 'body', {
    required: true,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  // Add any additional body parameters here
};

const updateContinentsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: geoContinents,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListContinentsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(geoContinents),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getContinentDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: geoContinents,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(geoContinents),
  // Add any additional query parameters here
};

const updateContinentSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoContinents,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  name: commonSchemas.objectSchema('name', 'body', { required: false, minSecurityLevel: 1 }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 3,
  }),
  surfaceArea: commonSchemas.numberSchema('surfaceArea', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  // Add any additional body parameters here
};

const deleteContinentSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: geoContinents,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createContinentSchema,
  updateContinentsStatusSchema,
  getListContinentsSchema,
  getContinentDetailsSchema,
  updateContinentSchema,
  deleteContinentSchema,
};
