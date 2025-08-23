// =============================================================================
// DATABASE SCHEMAS - Complete validation schemas for express-validator
// =============================================================================
//
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../../config/i18n');
const { convertToNumber } = require('../numbers.helper');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

const idSchema = (name, location = 'body', { required = true, formattingFunctions = [], model }) => {
  const fieldName = getFieldName(name);
  const validationSchema = {
    in: location,
    custom: {
      options: async (value) => {
        const data = await model.findByPk(value);

        return data !== null;
      },
    },
  };

  // Required field validation
  if (required) {
    validationSchema.exists = {
      errorMessage: i18n.__mf('validations.required', { field: fieldName }),
    };

    validationSchema.notEmpty = {
      errorMessage: i18n.__mf('validations.required', { field: fieldName }),
    };
  }

  formattingFunctions.push(convertToNumber);

  if (formattingFunctions.length > 0) {
    validationSchema.customSanitizer = {
      options: (value) => {
        return formattingFunctions.reduce((acc, func) => {
          return typeof func === 'function' ? func(acc) : acc;
        }, value);
      },
    };
  }

  return validationSchema;
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { idSchema };
