const { dataLanguages } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createLanguageSchema = {
  idFlag: commonSchemas.numberSchema('idFlag', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', {
    required: true,
    minSecurityLevel: 1,
    maxLength: 10,
  }),
  version: commonSchemas.stringSchema('version', 'body', { required: false, minSecurityLevel: 1, maxLength: 4 }),
  name: commonSchemas.objectSchema('name', 'body', { required: true, minSecurityLevel: 1 }),
  description: commonSchemas.objectSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  orientation: commonSchemas.inSchema('orientation', ['l2r', 'r2l', 't2bl2r', 't2br2l'], 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  public: commonSchemas.numberSchema('public', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const updateLanguagesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: dataLanguages,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListLanguagesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(dataLanguages),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  orientation: commonSchemas.inSchema('orientation', ['l2r', 'r2l', 't2bl2r', 't2br2l'], 'query', {
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional query parameters here
};

const getLanguageDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: dataLanguages,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(dataLanguages),
  // Add any additional query parameters here
};

const updateLanguageSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataLanguages,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  idFlag: commonSchemas.numberSchema('idFlag', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -2147483648,
    maxValue: 2147483647,
  }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 10,
  }),
  version: commonSchemas.stringSchema('version', 'body', { required: false, minSecurityLevel: 1, maxLength: 4 }),
  name: commonSchemas.objectSchema('name', 'body', { required: false, minSecurityLevel: 1 }),
  description: commonSchemas.objectSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  orientation: commonSchemas.inSchema('orientation', ['l2r', 'r2l', 't2bl2r', 't2br2l'], 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  public: commonSchemas.numberSchema('public', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const deleteLanguageSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: dataLanguages,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createLanguageSchema,
  updateLanguagesStatusSchema,
  getListLanguagesSchema,
  getLanguageDetailsSchema,
  updateLanguageSchema,
  deleteLanguageSchema,
};
