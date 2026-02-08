const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createShortenerSchema = {
  url: commonSchemas.linkSchema('url', 'body', { required: true }),
  codeShortener: commonSchemas.stringSchema('codeShortener', 'body', { required: true, maxLength: 8 }),
  expiresAt: commonSchemas.dateSchema('expiresAt', 'body', { required: false }),
  // Add any additional body parameters here
};

const updateShortenersStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'configShorteners', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListShortenersSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('configShorteners'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  // Add any additional query parameters here
};

const getShortenerDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'configShorteners',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('configShorteners'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateShortenerSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configShorteners', required: true, paranoid: false }),
  url: commonSchemas.linkSchema('url', 'body', { required: false }),
  codeShortener: commonSchemas.stringSchema('codeShortener', 'body', { required: false, maxLength: 8 }),
  expiresAt: commonSchemas.dateSchema('expiresAt', 'body', { required: false }),
  // Add any additional body parameters here
};

const deleteShortenerSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'configShorteners', required: true, paranoid: false }),
};

module.exports = {
  createShortenerSchema,
  updateShortenersStatusSchema,
  getListShortenersSchema,
  getShortenerDetailsSchema,
  updateShortenerSchema,
  deleteShortenerSchema,
};
