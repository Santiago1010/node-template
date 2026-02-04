const commonSchemas = require('../../helpers/validations/commonSchemas.helper');

const searchSchema = {
  search: commonSchemas.stringSchema('search', 'query', { required: false, minLength: 1 }),
};

module.exports = searchSchema;
