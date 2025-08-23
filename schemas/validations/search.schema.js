const commonSchemas = require('../../helpers/validations/commonSchemas.helper');

const searchSchema = {
  search: commonSchemas.stringSchema('search', 'query', { requied: false, minLength: 1 }),
};

module.exports = searchSchema;
