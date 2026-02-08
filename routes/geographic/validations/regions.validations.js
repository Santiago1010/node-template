const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../schemas/validations');

const createRegionSchema = {
  continentId: databaseSchemas.idSchema('continentId', 'body', { model: 'geoContinents', required: true }),
  name: commonSchemas.objectSchema('name', 'body', { required: true }),
  // Add any additional body parameters here
};

const updateRegionsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: 'geoRegions', required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),
  // Add any additional body parameters here
};

const getListRegionsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas('geoRegions'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  continentId: databaseSchemas.idSchema('continentId', 'query', { model: 'geoContinents', required: false }),
  // Add any additional query parameters here
};

const getRegionDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: 'geoRegions',
    required: true,
    paranoid: false,
  }),
  ...searchSchemas,
  ...filtersSchemas('geoRegions'),
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false }),
  continentId: databaseSchemas.idSchema('continentId', 'query', { model: 'geoContinents', required: false }),
  // Add any additional detail's query parameters here
};

const updateRegionSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoRegions', required: true, paranoid: false }),
  continentId: databaseSchemas.idSchema('continentId', 'body', { model: 'geoContinents', required: false }),
  name: commonSchemas.objectSchema('name', 'body', { required: false }),
  // Add any additional body parameters here
};

const deleteRegionSchema = {
  id: databaseSchemas.idSchema('id', 'params', { model: 'geoRegions', required: true, paranoid: false }),
};

module.exports = {
  createRegionSchema,
  updateRegionsStatusSchema,
  getListRegionsSchema,
  getRegionDetailsSchema,
  updateRegionSchema,
  deleteRegionSchema,
};
