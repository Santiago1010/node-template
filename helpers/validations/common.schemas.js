// =============================================================================
// COMMON SCHEMAS -
// =============================================================================
//
// =============================================================================

// =============================================================================
// NODE DEPENDENCIES
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../../config/i18n');

const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

/**
 * Generates a schema for validating number fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value
 *     before validation.
 *   @property {number} [minValue] - Minimum allowed value.
 *   @property {number} [maxValue] - Maximum allowed value.
 *   @property {number} [minLength] - Minimum length of the string representation of the number.
 *   @property {number} [maxLength] - Maximum length of the string representation of the number.
 *   @property {number} [minDecimal] - Minimum number of decimal places.
 *   @property {number} [maxDecimal] - Maximum number of decimal places.
 *
 * @returns {Object} Express-validator schema.
 */
const numberSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    minValue,
    maxValue,
    minLength,
    maxLength,
    minDecimal,
    maxDecimal,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Initial configuration for optional fields
  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

  // Required field validation
  if (required) {
    validationSchema.exists = {
      errorMessage: i18n.__mf('validations.required', { field: fieldName }),
    };

    if (!allowNull) {
      validationSchema.notEmpty = {
        errorMessage: i18n.__mf('validations.required', { field: fieldName }),
      };
    }
  }

  // Null value handling
  if (allowNull) {
    validationSchema.custom = {
      options: (value) => {
        if (value === null) return true;
        return value !== undefined;
      },
      errorMessage: i18n.__mf('validations.invalid', { field: fieldName }),
    };
  }

  // Numeric conversion and validation
  const hasDecimalValidation = minDecimal !== undefined || maxDecimal !== undefined;

  if (hasDecimalValidation) {
    validationSchema.toFloat = true;
    validationSchema.isFloat = {
      options: {
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
      },
      errorMessage: i18n.__mf('validations.float', {
        field: fieldName,
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
      }),
    };
  } else {
    validationSchema.toInt = true;
    validationSchema.isInt = {
      options: {
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
      },
      errorMessage: i18n.__mf('validations.integer', {
        field: fieldName,
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
      }),
    };
  }

  // Length validations (only for string representation)
  if (minLength !== undefined || maxLength !== undefined) {
    validationSchema.isLength = {
      options: {
        ...(minLength !== undefined && { min: minLength }),
        ...(maxLength !== undefined && { max: maxLength }),
      },
      errorMessage: i18n.__mf('validations.length', {
        field: fieldName,
        min: minLength,
        max: maxLength,
      }),
    };
  }

  // Decimal validation
  if (minDecimal !== undefined || maxDecimal !== undefined) {
    validationSchema.custom = {
      options: (value) => {
        if (value === null) return true;

        const parts = value.toString().split('.');
        const decimals = parts[1]?.length || 0;

        if (minDecimal !== undefined && decimals < minDecimal) {
          throw new Error(i18n.__mf('validations.minDecimal', { field: fieldName, minDecimal }));
        }

        if (maxDecimal !== undefined && decimals > maxDecimal) {
          throw new Error(i18n.__mf('validations.maxDecimal', { field: fieldName, maxDecimal }));
        }

        return true;
      },
    };
  }

  // Formatting functions
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
module.exports = { numberSchema };
