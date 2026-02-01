const { configShorteners } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createShortenerSchema = {
  url: commonSchemas.linkSchema('url', 'body', { required: true, minSecurityLevel: 1 }),
  codeShortener: commonSchemas.stringSchema('codeShortener', 'body', {
    required: true,
    minSecurityLevel: 1,
    maxLength: 8,
  }),
  expiresAt: commonSchemas.dateSchema('expiresAt', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const updateShortenersStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: configShorteners,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListShortenersSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(configShorteners),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getShortenerDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: configShorteners,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(configShorteners),
  // Add any additional query parameters here
};

const updateShortenerSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configShorteners,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  url: commonSchemas.linkSchema('url', 'body', { required: false, minSecurityLevel: 1 }),
  codeShortener: commonSchemas.stringSchema('codeShortener', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 8,
  }),
  expiresAt: commonSchemas.dateSchema('expiresAt', 'body', { required: false, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const deleteShortenerSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: configShorteners,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createShortenerSchema,
  updateShortenersStatusSchema,
  getListShortenersSchema,
  getShortenerDetailsSchema,
  updateShortenerSchema,
  deleteShortenerSchema,
};
