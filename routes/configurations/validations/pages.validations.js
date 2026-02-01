const { configPages, configHosts } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createPageSchema = {
  hostId: databaseSchemas.idSchema('hostId', 'body', { model: configHosts, required: true, minSecurityLevel: 1 }),
  pageId: databaseSchemas.idSchema('pageId', 'body', { model: configPages, required: false, minSecurityLevel: 1 }),
  name: commonSchemas.stringSchema('name', 'body', { required: true, minSecurityLevel: 1, maxLength: 100 }),
  path: commonSchemas.stringSchema('path', 'body', { required: true, minSecurityLevel: 1, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  level: commonSchemas.numberSchema('level', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  requiresAuthorization: commonSchemas.numberSchema('requiresAuthorization', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  hasSensitiveInformation: commonSchemas.numberSchema('hasSensitiveInformation', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const updatePagesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: configPages, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListPagesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configPages),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  hostId: databaseSchemas.idSchema('hostId', 'query', { model: configHosts, required: false, minSecurityLevel: 1 }),
  pageId: databaseSchemas.idSchema('pageId', 'query', { model: configPages, required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getPageDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configPages,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(configPages),
  // Add any additional query parameters here
};

const updatePageSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configPages,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  hostId: databaseSchemas.idSchema('hostId', 'body', { model: configHosts, required: false, minSecurityLevel: 1 }),
  pageId: databaseSchemas.idSchema('pageId', 'body', { model: configPages, required: false, minSecurityLevel: 1 }),
  name: commonSchemas.stringSchema('name', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  path: commonSchemas.stringSchema('path', 'body', { required: false, minSecurityLevel: 1, maxLength: 200 }),
  description: commonSchemas.stringSchema('description', 'body', { required: false, minSecurityLevel: 1 }),
  level: commonSchemas.numberSchema('level', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  requiresAuthorization: commonSchemas.numberSchema('requiresAuthorization', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  hasSensitiveInformation: commonSchemas.numberSchema('hasSensitiveInformation', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const deletePageSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configPages,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createPageSchema,
  updatePagesStatusSchema,
  getListPagesSchema,
  getPageDetailsSchema,
  updatePageSchema,
  deletePageSchema,
};
