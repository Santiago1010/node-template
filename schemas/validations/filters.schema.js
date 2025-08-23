const databaseSchemas = require('../../helpers/validations/databaseSchemas.helper');

const filtersSchemas = (model) => {
  return {
    ids: databaseSchemas.validateMultipleIds('ids', 'query', { model, required: false }),
    fields: databaseSchemas.validateModelAttributes('fields', 'query', { model, required: false }),
  };
};

module.exports = filtersSchemas;
