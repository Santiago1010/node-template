// =============================================================================
// COMMON SCHEMAS - Complete validation schemas for express-validator
// =============================================================================
// This module provides a comprehensive set of validation schemas for use with
// express-validator. Each schema generator handles common validation scenarios
// including required fields, type checking, formatting, and custom validation
// rules with internationalized error messages.
//
// Key Features:
// - i18n support for localized validation messages
// - Consistent validation patterns across different data types
// - Custom sanitization and formatting options
// - Flexible configuration for various validation requirements
//
// Usage Example:
// const { numberSchema, stringSchema } = require('./common.schemas');
//
// router.post('/example', [
//   check('age', numberSchema('age', 'body', { minValue: 18, maxValue: 99 })),
//   check('name', stringSchema('name', 'body', { maxLength: 50 })),
// ], controller.handler);
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const numberHelper = require('../numbers.helper');
const securityHelper = require('../security.helper');
const stringHelper = require('../strings.helper');
const utilitiesHelper = require('../utilities.helper');
const i18n = require('../../config/i18n');
const { THREAT_LEVELS } = require('../constants.helper');
const { cerror } = require('../debug.helper');

const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

const defaultStringSanitizer = (value) => {
  if (typeof value !== 'string') return value;
  return securityHelper.validateAndSanitizeString(value, {
    allowHTML: false,
    allowSpecialChars: true,
  }).sanitized;
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

/**
 * Generates a schema for validating string fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {number} [minLength] - Minimum string length.
 *   @property {number} [maxLength] - Maximum string length.
 *   @property {RegExp} [pattern] - Regular expression pattern to match.
 *   @property {boolean} [alphaOnly=false] - Only alphabetic characters allowed.
 *   @property {boolean} [numericOnly=false] - Only numeric characters allowed.
 *   @property {boolean} [alphanumericOnly=false] - Only alphanumeric characters allowed.
 *   @property {boolean} [trim=true] - Trim whitespace.
 *   @property {boolean} [toLowerCase=false] - Convert to lowercase.
 *   @property {boolean} [toUpperCase=false] - Convert to uppercase.
 *   @property {boolean} [capitalize=false] - Capitalize first letter.
 *
 * @returns {Object} Express-validator schema.
 */
const stringSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    minLength,
    maxLength,
    pattern,
    alphaOnly = false,
    numericOnly = false,
    alphanumericOnly = false,
    trim = true,
    toLowerCase = false,
    toUpperCase = false,
    capitalize = false,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  formattingFunctions.push(defaultStringSanitizer);

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

  // Trim whitespace
  if (trim) {
    validationSchema.trim = true;
  }

  // String type validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Length validations
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

  // Character type validations using string helper
  if (alphaOnly) {
    validationSchema.custom = {
      options: (value) => {
        if (allowNull && value === null) return true;
        if (!stringHelper.isAlphaOnly(value)) {
          throw new Error(i18n.__mf('validations.alphaOnly', { field: fieldName }));
        }
        return true;
      },
    };
  } else if (numericOnly) {
    validationSchema.custom = {
      options: (value) => {
        if (allowNull && value === null) return true;
        if (!stringHelper.isNumericOnly(value)) {
          throw new Error(i18n.__mf('validations.numericOnly', { field: fieldName }));
        }
        return true;
      },
    };
  } else if (alphanumericOnly) {
    validationSchema.custom = {
      options: (value) => {
        if (allowNull && value === null) return true;
        if (!stringHelper.isAlphanumeric(value)) {
          throw new Error(i18n.__mf('validations.alphanumericOnly', { field: fieldName }));
        }
        return true;
      },
    };
  }

  // Pattern validation
  if (pattern) {
    validationSchema.matches = {
      options: pattern,
      errorMessage: i18n.__mf('validations.pattern', { field: fieldName }),
    };
  }

  // Case transformations
  if (toLowerCase) {
    validationSchema.toLowerCase = true;
  } else if (toUpperCase) {
    validationSchema.toUpperCase = true;
  }

  // Formatting functions (including capitalize)
  const allFormattingFunctions = [...formattingFunctions];
  if (capitalize) {
    allFormattingFunctions.push(stringHelper.formatCapitalize);
  }

  if (allFormattingFunctions.length > 0) {
    validationSchema.customSanitizer = {
      options: (value) => {
        return allFormattingFunctions.reduce((acc, func) => {
          return typeof func === 'function' ? func(acc) : acc;
        }, value);
      },
    };
  }

  return validationSchema;
};

/**
 * Generates a schema for validating enum/choice fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {Array} allowedValues - Array of allowed values.
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {boolean} [caseSensitive=true] - Whether comparison is case-sensitive.
 *
 * @returns {Object} Express-validator schema.
 */
const inSchema = (
  name,
  allowedValues,
  location = 'body',
  { required = true, allowNull = false, formattingFunctions = [], caseSensitive = true } = {}
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

  // Enum validation
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      let compareValues = allowedValues;
      let compareValue = value;

      if (!caseSensitive && typeof value === 'string') {
        compareValues = allowedValues.map((v) => (typeof v === 'string' ? v.toLowerCase() : v));
        compareValue = value.toLowerCase();
      }

      if (!compareValues.includes(compareValue)) {
        throw new Error(
          i18n.__mf('validations.enum', {
            field: fieldName,
            values: allowedValues.join(', '),
          })
        );
      }
      return true;
    },
  };

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

/**
 * Generates a schema for validating date fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {string} [format] - Expected date format (ISO8601, YYYY-MM-DD, etc.).
 *   @property {Date|string} [minDate] - Minimum allowed date.
 *   @property {Date|string} [maxDate] - Maximum allowed date.
 *   @property {boolean} [futureOnly=false] - Only future dates allowed.
 *   @property {boolean} [pastOnly=false] - Only past dates allowed.
 *
 * @returns {Object} Express-validator schema.
 */
const dateSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    format,
    minDate,
    maxDate,
    futureOnly = false,
    pastOnly = false,
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

  // Date validation
  if (format) {
    validationSchema.matches = {
      options: format === 'ISO8601' ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ : new RegExp(format),
      errorMessage: i18n.__mf('validations.dateFormat', { field: fieldName, format }),
    };
  } else {
    validationSchema.isISO8601 = {
      options: { strict: true },
      errorMessage: i18n.__mf('validations.date', { field: fieldName }),
    };
  }

  // Convert to date
  validationSchema.toDate = true;

  // Custom date validations
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(i18n.__mf('validations.date', { field: fieldName }));
      }

      const now = new Date();

      // Future/past validations
      if (futureOnly && date <= now) {
        throw new Error(i18n.__mf('validations.futureDate', { field: fieldName }));
      }

      if (pastOnly && date >= now) {
        throw new Error(i18n.__mf('validations.pastDate', { field: fieldName }));
      }

      // Min/max date validations
      if (minDate) {
        const minDateObj = new Date(minDate);
        if (date < minDateObj) {
          throw new Error(i18n.__mf('validations.minDate', { field: fieldName, minDate }));
        }
      }

      if (maxDate) {
        const maxDateObj = new Date(maxDate);
        if (date > maxDateObj) {
          throw new Error(i18n.__mf('validations.maxDate', { field: fieldName, maxDate }));
        }
      }

      return true;
    },
  };

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

/**
 * Generates a schema for validating date range fields.
 *
 * @param {string} startDateName - Logical field name for start date.
 * @param {string} endDateName - Logical field name for end date.
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether both fields are required.
 *   @property {boolean} [allowNull=false] - Whether null is acceptable.
 *   @property {number} [maxDaysRange] - Maximum days between start and end.
 *   @property {number} [minDaysRange] - Minimum days between start and end.
 *
 * @returns {Object} Express-validator schema with both date fields.
 */
const dateRangeSchema = (
  startDateName,
  endDateName,
  location = 'body',
  { required = true, allowNull = false, maxDaysRange, minDaysRange } = {}
) => {
  const startFieldName = getFieldName(startDateName);
  const endFieldName = getFieldName(endDateName);

  const schema = {};

  // Start date schema
  schema[startDateName] = dateSchema(startDateName, location, { required, allowNull });

  // End date schema
  schema[endDateName] = dateSchema(endDateName, location, { required, allowNull });

  // Add custom validation for date range
  schema[endDateName].custom = {
    options: (endDateValue, { req }) => {
      const startDateValue = req[location][startDateName];

      if ((allowNull && startDateValue === null) || (allowNull && endDateValue === null)) {
        return true;
      }

      const startDate = new Date(startDateValue);
      const endDate = new Date(endDateValue);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return true; // Let individual date validations handle invalid dates
      }

      if (endDate < startDate) {
        throw new Error(
          i18n.__mf('validations.dateRange', {
            startField: startFieldName,
            endField: endFieldName,
          })
        );
      }

      // Range validations
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      if (minDaysRange !== undefined && daysDiff < minDaysRange) {
        throw new Error(
          i18n.__mf('validations.minDaysRange', {
            field: endFieldName,
            minDays: minDaysRange,
          })
        );
      }

      if (maxDaysRange !== undefined && daysDiff > maxDaysRange) {
        throw new Error(
          i18n.__mf('validations.maxDaysRange', {
            field: endFieldName,
            maxDays: maxDaysRange,
          })
        );
      }

      return true;
    },
  };

  return schema;
};

/**
 * Generates a schema for validating array fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {number} [minLength] - Minimum array length.
 *   @property {number} [maxLength] - Maximum array length.
 *   @property {string} [itemType] - Type of items ('string', 'number', 'boolean').
 *   @property {Array} [allowedValues] - Array of allowed values for items.
 *   @property {boolean} [uniqueItems=false] - Whether array items must be unique.
 *
 * @returns {Object} Express-validator schema.
 */
const arraySchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    minLength,
    maxLength,
    itemType,
    allowedValues,
    uniqueItems = false,
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

  // Array validation
  validationSchema.isArray = {
    errorMessage: i18n.__mf('validations.array', { field: fieldName }),
  };

  // Array length validation
  if (minLength !== undefined || maxLength !== undefined) {
    validationSchema.custom = {
      options: (value) => {
        if (allowNull && value === null) return true;

        if (!Array.isArray(value)) return true; // Let isArray handle this

        if (minLength !== undefined && value.length < minLength) {
          throw new Error(i18n.__mf('validations.arrayMinLength', { field: fieldName, minLength }));
        }

        if (maxLength !== undefined && value.length > maxLength) {
          throw new Error(i18n.__mf('validations.arrayMaxLength', { field: fieldName, maxLength }));
        }

        return true;
      },
    };
  }

  // Item type and value validation
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      if (!Array.isArray(value)) return true; // Let isArray handle this

      // Item type validation
      if (itemType) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          let isValidType = false;

          switch (itemType) {
            case 'string':
              isValidType = typeof item === 'string';
              break;
            case 'number':
              isValidType = numberHelper.isValidNumber(item);
              break;
            case 'boolean':
              isValidType = typeof item === 'boolean';
              break;
          }

          if (!isValidType) {
            throw new Error(
              i18n.__mf('validations.arrayItemType', {
                field: fieldName,
                index: i,
                type: itemType,
              })
            );
          }
        }
      }

      // Allowed values validation
      if (allowedValues && Array.isArray(allowedValues)) {
        for (let i = 0; i < value.length; i++) {
          if (!allowedValues.includes(value[i])) {
            throw new Error(
              i18n.__mf('validations.arrayItemEnum', {
                field: fieldName,
                index: i,
                values: allowedValues.join(', '),
              })
            );
          }
        }
      }

      // Unique items validation
      if (uniqueItems) {
        const uniqueValues = [...new Set(value)];
        if (uniqueValues.length !== value.length) {
          throw new Error(i18n.__mf('validations.arrayUniqueItems', { field: fieldName }));
        }
      }

      return true;
    },
  };

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

/**
 * Generates a schema for validating boolean fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {boolean} [strictMode=false] - Only accept true/false (not truthy/falsy).
 *
 * @returns {Object} Express-validator schema.
 */
const booleanSchema = (
  name,
  location = 'body',
  { required = true, allowNull = false, formattingFunctions = [], strictMode = false } = {}
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

  // Boolean validation and conversion
  if (strictMode) {
    validationSchema.isBoolean = {
      options: { strict: true },
      errorMessage: i18n.__mf('validations.boolean', { field: fieldName }),
    };
  } else {
    validationSchema.customSanitizer = {
      options: (value) => {
        if (allowNull && value === null) return null;
        return utilitiesHelper.toBoolean(value);
      },
    };

    validationSchema.isBoolean = {
      errorMessage: i18n.__mf('validations.boolean', { field: fieldName }),
    };
  }

  // Additional formatting functions
  if (formattingFunctions.length > 0) {
    const existingSanitizer = validationSchema.customSanitizer;
    validationSchema.customSanitizer = {
      options: (value) => {
        let processedValue = existingSanitizer ? existingSanitizer.options(value) : value;

        return formattingFunctions.reduce((acc, func) => {
          return typeof func === 'function' ? func(acc) : acc;
        }, processedValue);
      },
    };
  }

  return validationSchema;
};

/**
 * Generates a schema for validating object fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {Array<string>} [requiredProperties] - Required properties in the object.
 *   @property {Object} [propertyTypes] - Expected types for properties (e.g., { name: 'string', age: 'number' }).
 *   @property {number} [minProperties] - Minimum number of properties.
 *   @property {number} [maxProperties] - Maximum number of properties.
 *   @property {boolean} [strictProperties=false] - Only allow specified properties.
 *
 * @returns {Object} Express-validator schema.
 */
const objectSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    requiredProperties = [],
    propertyTypes = {},
    minProperties,
    maxProperties,
    strictProperties = false,
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

  // Object validation
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      // Check if it's a plain object
      if (!utilitiesHelper.isPlainObject(value)) {
        throw new Error(i18n.__mf('validations.object', { field: fieldName }));
      }

      const objectKeys = Object.keys(value);

      // Min/max properties validation
      if (minProperties !== undefined && objectKeys.length < minProperties) {
        throw new Error(
          i18n.__mf('validations.objectMinProperties', {
            field: fieldName,
            minProperties,
          })
        );
      }

      if (maxProperties !== undefined && objectKeys.length > maxProperties) {
        throw new Error(
          i18n.__mf('validations.objectMaxProperties', {
            field: fieldName,
            maxProperties,
          })
        );
      }

      // Required properties validation
      if (requiredProperties.length > 0) {
        for (const prop of requiredProperties) {
          if (!(prop in value) || value[prop] === undefined) {
            throw new Error(
              i18n.__mf('validations.objectRequiredProperty', {
                field: fieldName,
                property: prop,
              })
            );
          }
        }
      }

      // Property types validation
      if (Object.keys(propertyTypes).length > 0) {
        for (const [prop, expectedType] of Object.entries(propertyTypes)) {
          if (prop in value) {
            const propValue = value[prop];
            let isValidType = false;

            switch (expectedType) {
              case 'string':
                isValidType = typeof propValue === 'string';
                break;
              case 'number':
                isValidType = numberHelper.isValidNumber(propValue);
                break;
              case 'boolean':
                isValidType = typeof propValue === 'boolean';
                break;
              case 'array':
                isValidType = Array.isArray(propValue);
                break;
              case 'object':
                isValidType = utilitiesHelper.isPlainObject(propValue);
                break;
            }

            if (!isValidType) {
              throw new Error(
                i18n.__mf('validations.objectPropertyType', {
                  field: fieldName,
                  property: prop,
                  expectedType,
                })
              );
            }
          }
        }
      }

      // Strict properties validation
      if (strictProperties && Object.keys(propertyTypes).length > 0) {
        const allowedProperties = Object.keys(propertyTypes);
        for (const prop of objectKeys) {
          if (!allowedProperties.includes(prop)) {
            throw new Error(
              i18n.__mf('validations.objectUnknownProperty', {
                field: fieldName,
                property: prop,
                allowedProperties: allowedProperties.join(', '),
              })
            );
          }
        }
      }

      return true;
    },
  };

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

/**
 * Generates a schema for validating password fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {number} [minLength=8] - Minimum password length.
 *   @property {number} [maxLength=128] - Maximum password length.
 *   @property {boolean} [requireUppercase=true] - Require at least one uppercase letter.
 *   @property {boolean} [requireLowercase=true] - Require at least one lowercase letter.
 *   @property {boolean} [requireNumbers=true] - Require at least one number.
 *   @property {boolean} [requireSpecialChars=true] - Require at least one special character.
 *   @property {string} [specialChars='!@#$%^&*()_+-=[]{}|;:,.<>?'] - Allowed special characters.
 *   @property {boolean} [noSpaces=true] - Disallow spaces in password.
 *   @property {Array<string>} [forbiddenPatterns=[]] - Forbidden patterns/words.
 *
 * @returns {Object} Express-validator schema.
 */
const passwordSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?',
    noSpaces = true,
    forbiddenPatterns = [],
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

  // String type validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Length validation
  validationSchema.isLength = {
    options: { min: minLength, max: maxLength },
    errorMessage: i18n.__mf('validations.passwordLength', {
      field: fieldName,
      min: minLength,
      max: maxLength,
    }),
  };

  // Password complexity validation
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.string', { field: fieldName }));
      }

      // Check for spaces
      if (noSpaces && /\s/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordNoSpaces', { field: fieldName }));
      }

      // Check for uppercase letters
      if (requireUppercase && !/[A-Z]/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordUppercase', { field: fieldName }));
      }

      // Check for lowercase letters
      if (requireLowercase && !/[a-z]/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordLowercase', { field: fieldName }));
      }

      // Check for numbers
      if (requireNumbers && !/\d/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordNumbers', { field: fieldName }));
      }

      // Check for special characters
      if (requireSpecialChars) {
        const specialCharsRegex = new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
        if (!specialCharsRegex.test(value)) {
          throw new Error(
            i18n.__mf('validations.passwordSpecialChars', {
              field: fieldName,
              specialChars,
            })
          );
        }
      }

      // Check for forbidden patterns
      if (forbiddenPatterns.length > 0) {
        for (const pattern of forbiddenPatterns) {
          const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (regex.test(value)) {
            throw new Error(
              i18n.__mf('validations.passwordForbiddenPattern', {
                field: fieldName,
                pattern: pattern.toString(),
              })
            );
          }
        }
      }

      return true;
    },
  };

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

/**
 * Generates a schema for validating array fields sent as strings.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {string} [separator=','] - Separator used in the string array.
 *   @property {number} [minLength] - Minimum array length after conversion.
 *   @property {number} [maxLength] - Maximum array length after conversion.
 *   @property {string} [itemType] - Type to convert items to ('string', 'number').
 *   @property {Array} [allowedValues] - Array of allowed values for items.
 *   @property {boolean} [uniqueItems=true] - Whether array items must be unique.
 *   @property {boolean} [trimItems=true] - Whether to trim individual items.
 *
 * @returns {Object} Express-validator schema.
 */
const arrayStringSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    separator = ',',
    minLength,
    maxLength,
    itemType,
    allowedValues,
    uniqueItems = true,
    trimItems = true,
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

  // Convert string to array
  validationSchema.customSanitizer = {
    options: (value) => {
      if (allowNull && value === null) return null;

      if (typeof value === 'string') {
        return utilitiesHelper.stringToArray(value, separator, {
          trimElements: trimItems,
          uniqueElements: uniqueItems,
          numberElements: itemType === 'number',
        });
      }

      return value;
    },
  };

  // Array validation
  validationSchema.isArray = {
    errorMessage: i18n.__mf('validations.array', { field: fieldName }),
  };

  // Custom validation for array constraints
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      if (!Array.isArray(value)) return true; // Let isArray handle this

      // Length validation
      if (minLength !== undefined && value.length < minLength) {
        throw new Error(i18n.__mf('validations.arrayMinLength', { field: fieldName, minLength }));
      }

      if (maxLength !== undefined && value.length > maxLength) {
        throw new Error(i18n.__mf('validations.arrayMaxLength', { field: fieldName, maxLength }));
      }

      // Item type validation
      if (itemType) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          let isValidType = false;

          switch (itemType) {
            case 'string':
              isValidType = typeof item === 'string';
              break;
            case 'number':
              isValidType = numberHelper.isValidNumber(item);
              break;
          }

          if (!isValidType) {
            throw new Error(
              i18n.__mf('validations.arrayItemType', {
                field: fieldName,
                index: i,
                type: itemType,
              })
            );
          }
        }
      }

      // Allowed values validation
      if (allowedValues && Array.isArray(allowedValues)) {
        for (let i = 0; i < value.length; i++) {
          if (!allowedValues.includes(value[i])) {
            throw new Error(
              i18n.__mf('validations.arrayItemEnum', {
                field: fieldName,
                index: i,
                values: allowedValues.join(', '),
              })
            );
          }
        }
      }

      return true;
    },
  };

  // Additional formatting functions
  if (formattingFunctions.length > 0) {
    const existingSanitizer = validationSchema.customSanitizer;
    validationSchema.customSanitizer = {
      options: (value) => {
        let processedValue = existingSanitizer.options(value);

        return formattingFunctions.reduce((acc, func) => {
          return typeof func === 'function' ? func(acc) : acc;
        }, processedValue);
      },
    };
  }

  return validationSchema;
};

/**
 * Generates a schema for validating URL/link fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {Array<string>} [allowedProtocols=['http', 'https']] - Allowed protocols.
 *   @property {Array<string>} [allowedDomains] - Allowed domains (if specified).
 *   @property {boolean} [requireTLD=true] - Whether to require top-level domain.
 *   @property {boolean} [trim=true] - Whether to trim the URL.
 *
 * @returns {Object} Express-validator schema.
 */
const linkSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    allowedProtocols = ['http', 'https'],
    allowedDomains,
    requireTLD = true,
    trim = true,
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

  // Trim URL
  if (trim) {
    validationSchema.trim = true;
  }

  // String validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // URL validation using string helper
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      if (!stringHelper.isURL(value)) {
        throw new Error(i18n.__mf('validations.url', { field: fieldName }));
      }

      try {
        const url = new URL(value);

        // Protocol validation
        if (allowedProtocols.length > 0) {
          const protocol = url.protocol.replace(':', '');
          if (!allowedProtocols.includes(protocol)) {
            throw new Error(
              i18n.__mf('validations.urlProtocol', {
                field: fieldName,
                allowedProtocols: allowedProtocols.join(', '),
              })
            );
          }
        }

        // Domain validation
        if (allowedDomains && allowedDomains.length > 0) {
          if (!allowedDomains.includes(url.hostname)) {
            throw new Error(
              i18n.__mf('validations.urlDomain', {
                field: fieldName,
                allowedDomains: allowedDomains.join(', '),
              })
            );
          }
        }

        // TLD validation
        if (requireTLD) {
          if (!url.hostname.includes('.')) {
            throw new Error(i18n.__mf('validations.urlTLD', { field: fieldName }));
          }
        }

        return true;
      } catch (error) {
        cerror('helpers/validations/common.schemas.js.linkSchema', error);
        throw new Error(i18n.__mf('validations.url', { field: fieldName }));
      }
    },
  };

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

/**
 * Generates a schema for validating JWT token fields (structure only, no signature verification).
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {boolean} [validatePayload=false] - Whether to validate payload structure.
 *   @property {Array<string>} [requiredClaims] - Required claims in payload (if validatePayload=true).
 *   @property {boolean} [checkExpiry=false] - Whether to check if token is expired.
 *
 * @returns {Object} Express-validator schema.
 */
const jwtSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    validatePayload = false,
    requiredClaims = [],
    checkExpiry = false,
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

  // String validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // JWT structure validation
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }

      // Check JWT structure (3 parts separated by dots)
      const parts = value.split('.');
      if (parts.length !== 3) {
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }

      try {
        // Decode header and payload (without verification)
        // const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        // Validate payload structure if required
        if (validatePayload) {
          if (!utilitiesHelper.isPlainObject(payload)) {
            throw new Error(i18n.__mf('validations.jwtPayload', { field: fieldName }));
          }

          // Check required claims
          if (requiredClaims.length > 0) {
            for (const claim of requiredClaims) {
              if (!(claim in payload)) {
                throw new Error(
                  i18n.__mf('validations.jwtMissingClaim', {
                    field: fieldName,
                    claim,
                  })
                );
              }
            }
          }

          // Check expiry if required
          if (checkExpiry && payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
              throw new Error(i18n.__mf('validations.jwtExpired', { field: fieldName }));
            }
          }
        }

        return true;
      } catch (error) {
        cerror('helpers/validations/common.schemas.js.jwtSchema', error);
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }
    },
  };

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

/**
 * Generates a schema for validating UUID fields.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {Array<number>} [versions=[1,2,3,4,5]] - Allowed UUID versions.
 *   @property {boolean} [caseSensitive=false] - Whether UUID should be case-sensitive.
 *   @property {boolean} [requireHyphens=true] - Whether to require hyphens in UUID format.
 *
 * @returns {Object} Express-validator schema.
 */
const uuidSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    versions = [1, 2, 3, 4, 5],
    caseSensitive = false,
    requireHyphens = true,
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

  // Case normalization
  if (!caseSensitive) {
    validationSchema.toLowerCase = true;
  }

  // String validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // UUID validation
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.uuid', { field: fieldName }));
      }

      // let uuidValue = value;

      // Remove hyphens if not required for validation
      const withoutHyphens = value.replace(/-/g, '');

      if (requireHyphens) {
        // UUID with hyphens: 8-4-4-4-12 format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          throw new Error(i18n.__mf('validations.uuid', { field: fieldName }));
        }
      } else {
        // Allow both with and without hyphens
        const uuidRegexWithHyphens = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const uuidRegexWithoutHyphens = /^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i;

        if (!uuidRegexWithHyphens.test(value) && !uuidRegexWithoutHyphens.test(value)) {
          throw new Error(i18n.__mf('validations.uuid', { field: fieldName }));
        }
      }

      // Version validation
      if (versions.length > 0) {
        const versionChar = requireHyphens ? value[14] : withoutHyphens[12];
        const version = parseInt(versionChar, 10);

        if (!versions.includes(version)) {
          throw new Error(
            i18n.__mf('validations.uuidVersion', {
              field: fieldName,
              allowedVersions: versions.join(', '),
            })
          );
        }
      }

      return true;
    },
  };

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

/**
 * Generates a schema for validating HTML content fields with secure sanitization.
 *
 * @param {string} name - Logical field name (used for i18n messages).
 * @param {string} [location='body'] - 'body' | 'query' | 'params' | 'headers' | 'cookies' | etc.
 * @param {Object} [options={}] - Object with options:
 *   @property {boolean} [required=true] - Whether field is required.
 *   @property {boolean} [allowNull=false] - Whether null is an acceptable value.
 *   @property {function[]} [formattingFunctions=[]] - Array of functions to format the value.
 *   @property {number} [minLength] - Minimum HTML content length.
 *   @property {number} [maxLength=10000] - Maximum HTML content length.
 *   @property {boolean} [stripDangerousTags=true] - Whether to strip potentially dangerous tags.
 *   @property {Array} [allowedTags=['p','br','strong','em','u','ul','ol','li','h1','h2','h3','h4','h5','h6']] - Allowed HTML tags.
 *   @property {Array} [allowedAttributes=['class','style']] - Allowed HTML attributes.
 *
 * @returns {Object} Express-validator schema.
 */
const htmlSchema = (
  name,
  location = 'body',
  {
    required = true,
    allowNull = false,
    formattingFunctions = [],
    minLength,
    maxLength = 10000,
    stripDangerousTags = true,
    allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes = ['class', 'style'],
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

  // String type validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Length validations
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

  // HTML-specific security validation
  validationSchema.custom = {
    options: (value) => {
      if (allowNull && value === null) return true;

      // Check for potentially dangerous content
      if (stripDangerousTags && securityHelper.detectXSS(value)) {
        securityHelper.logSecurityEvent('HTML_XSS_ATTEMPT', { field: name }, THREAT_LEVELS.HIGH);
        throw new Error(i18n.__mf('validations.htmlSecurity', { field: fieldName }));
      }

      return true;
    },
  };

  // Secure HTML sanitization
  validationSchema.customSanitizer = {
    options: (value) => {
      if (allowNull && value === null) return null;

      let sanitized = value;

      // Apply user formatting functions first
      sanitized = formattingFunctions.reduce((acc, func) => {
        return typeof func === 'function' ? func(acc) : acc;
      }, sanitized);

      // Apply security sanitization
      sanitized = securityHelper.sanitizeHTML(sanitized, {
        allowedTags,
        allowedAttributes,
        stripDangerousTags,
      });

      return sanitized;
    },
  };

  return validationSchema;
};

module.exports = {
  numberSchema,
  stringSchema,
  inSchema,
  dateSchema,
  dateRangeSchema,
  arraySchema,
  booleanSchema,
  objectSchema,
  passwordSchema,
  arrayStringSchema,
  linkSchema,
  jwtSchema,
  uuidSchema,
  htmlSchema,
};
