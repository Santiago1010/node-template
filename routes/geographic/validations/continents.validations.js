const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createContinentSchema = {
  name: commonSchemas.objectSchema('name', 'body', { required: true }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', { required: true, maxLength: 3 }),
  // Add any additional body parameters here
};

const updateContinentsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'geoContinents', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListContinentsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('geoContinents'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  // Add any additional query parameters here
};

const getContinentDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'geoContinents',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('geoContinents'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  // Add any additional detail's query parameters here
};

const updateContinentSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoContinents', required: true, paranoid: false }),
  name: commonSchemas.objectSchema('name', 'body', { required: false }),
  abbreviation: commonSchemas.stringSchema('abbreviation', 'body', { required: false, maxLength: 3 }),
  // Add any additional body parameters here
};

const deleteContinentSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoContinents', required: true, paranoid: false }),
};

module.exports = {
  createContinentSchema,
  updateContinentsStatusSchema,
  getListContinentsSchema,
  getContinentDetailsSchema,
  updateContinentSchema,
  deleteContinentSchema,
};
