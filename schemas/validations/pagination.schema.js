const commonSchemas = require('../../helpers/validations/commonSchemas.helper');

const paginationSchema = {
  limit: commonSchemas.numberSchema('limit', 'query', {
    required: false,
    minValue: 1,
    maxValue: 100,
  }),
  page: commonSchemas.numberSchema('page', 'query', {
    required: false,
    minValue: 1,
  }),
};

module.exports = paginationSchema;
