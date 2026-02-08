const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createLanguageSchema = {
  flagId: databaseSchemas.idSchema('flagId', 'body', { model: 'dataFlags', required: false }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', { required: true, maxLength: 10 }),
  version: commonSchemas.stringSchema('version', 'body', { required: false, maxLength: 4 }),
  name: commonSchemas.objectSchema('name', 'body', { required: true }),
  description: commonSchemas.objectSchema('description', 'body', { required: false }),
  orientation: commonSchemas.inSchema('orientation', ['l2r', 'r2l', 't2bl2r', 't2br2l'], 'body', { required: false }),
  isPublic: commonSchemas.booleanSchema('isPublic', 'body', { required: false }),
  // Add any additional body parameters here
};

const updateLanguagesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'dataLanguages', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListLanguagesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('dataLanguages'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  flagId: databaseSchemas.idSchema('flagId', 'query', { model: 'dataFlags', required: false }),
  orientation: commonSchemas.inSchema('orientation', ['l2r', 'r2l', 't2bl2r', 't2br2l'], 'query', { required: false }),
  isPublic: commonSchemas.booleanSchema('isPublic', 'query', { required: false }),
  // Add any additional query parameters here
};

const getLanguageDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'dataLanguages',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('dataLanguages'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  flagId: databaseSchemas.idSchema('flagId', 'query', { model: 'dataFlags', required: false }),
  orientation: commonSchemas.inSchema('orientation', ['l2r', 'r2l', 't2bl2r', 't2br2l'], 'query', { required: false }),
  isPublic: commonSchemas.booleanSchema('isPublic', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateLanguageSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'dataLanguages', required: true, paranoid: false }),
  flagId: databaseSchemas.idSchema('flagId', 'body', { model: 'dataFlags', required: false }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', { required: false, maxLength: 10 }),
  version: commonSchemas.stringSchema('version', 'body', { required: false, maxLength: 4 }),
  name: commonSchemas.objectSchema('name', 'body', { required: false }),
  description: commonSchemas.objectSchema('description', 'body', { required: false }),
  orientation: commonSchemas.inSchema('orientation', ['l2r', 'r2l', 't2bl2r', 't2br2l'], 'body', { required: false }),
  isPublic: commonSchemas.booleanSchema('isPublic', 'body', { required: false }),
  // Add any additional body parameters here
};

const deleteLanguageSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'dataLanguages', required: true, paranoid: false }),
};

module.exports = {
  createLanguageSchema,
  updateLanguagesStatusSchema,
  getListLanguagesSchema,
  getLanguageDetailsSchema,
  updateLanguageSchema,
  deleteLanguageSchema,
};
