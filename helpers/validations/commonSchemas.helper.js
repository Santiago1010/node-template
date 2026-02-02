// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const numberHelper = require('../../utils/numbers.util'); // Number validation and formatting utilities
const securityHelper = require('../security.helper'); // Security validation and XSS protection
const stringHelper = require('../../utils/strings.util'); // String manipulation and validation utilities
const utilitiesHelper = require('../../utils/utilities.util'); // General utility functions and type checks
const i18n = require('../../config/i18n'); // Internationalization for error messages
const { THREAT_LEVELS } = require('../../utils/constants.util'); // Security threat level constants
const { cerror, isDevelopmentMode } = require('../debug.helper'); // Debugging utilities and environment detection

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Retrieves internationalized field name for validation messages
 *
 * @description Gets the translated field name from i18n configuration or returns fallback
 * @param {string} name - Field identifier used in i18n configuration
 * @returns {string} Internationalized field name or fallback identifier
 *
 * @example
 * // Returns translated "Username" or "fields.username"
 * const fieldName = getFieldName('username');
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 * @see {@link i18n} for internationalization configuration
 */
const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

/**
 * Validates that the authenticated user possesses the required scope.
 *
 * @description Centralised, null-safe scope guard used by every schema generator.
 * Execution order:
 *   1. If `requiredScope` is falsy the function is a no-op (returns immediately).
 *   2. `req` itself is checked — guards against destructuring edge-cases where
 *      the second argument to a custom validator is undefined.
 *   3. `req.user` is checked — the request may be unauthenticated.
 *   4. `req.user.scopes` is checked for existence AND for Array type — a
 *      misconfigured auth middleware could set it to null, undefined, a string, etc.
 *   5. Finally, `.includes()` is called only when we are certain the target is an Array.
 *
 * @param {object|undefined} req           - The Express request object (may be undefined).
 * @param {string}           requiredScope - The OAuth / RBAC scope that must be present.
 * @throws {Error} `error.user_not_found`  — when `req.user` is missing.
 * @throws {Error} `error.scopes_invalid`  — when `req.user.scopes` is not a valid Array.
 * @throws {Error} `error.access_denied`   — when the scope is absent from the user's list.
 *                                           The message includes the missing scope so logs
 *                                           are immediately debuggable.
 * @returns {void}
 *
 * @example
 * // Inside any custom validator:
 * validateScope(req, requiredScope); // throws or returns — nothing else needed
 *
 * @complexity Time: O(n) where n = user.scopes.length (single .includes pass)
 * @since Version 1.1.0
 */
const validateScope = (req, requiredScope) => {
  // 1. Nothing to do when no scope is required
  if (!requiredScope) return;

  // 2. req itself must exist (edge-case: express-validator passes { req } but
  //    in rare middleware configurations req can be undefined)
  if (!req || typeof req !== 'object') {
    throw new Error(i18n.__('error.user_not_found'));
  }

  // 3. An authenticated user must be present on the request
  if (!req.user || typeof req.user !== 'object') {
    throw new Error(i18n.__('error.user_not_found'));
  }

  // 4. scopes must exist AND be an actual Array — guards against null, undefined,
  //    a plain string, or any other type that would crash on .includes()
  if (!Array.isArray(req.user.scopes)) {
    throw new Error(i18n.__('error.scopes_invalid'));
  }

  // 5. The required scope must be present in the user's scope list
  if (!req.user.scopes.includes(requiredScope)) {
    throw new Error(i18n.__mf('error.access_denied', { scope: requiredScope }));
  }
};

// =============================================================================
// SCHEMA GENERATORS
// =============================================================================

/**
 * Generates validation schema for number fields
 *
 * @description Creates comprehensive number validation with integer/float support, range limits,
 *              and decimal precision
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {number} [options.minValue] - Minimum allowed value (inclusive)
 * @param {number} [options.maxValue] - Maximum allowed value (inclusive)
 * @param {number} [options.minLength] - Minimum digit length (string representation)
 * @param {number} [options.maxLength] - Maximum digit length (string representation)
 * @param {number} [options.minDecimal] - Minimum decimal places required
 * @param {number} [options.maxDecimal] - Maximum decimal places allowed
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Basic required integer validation
 * const schema = numberSchema('age', 'body', { minValue: 0, maxValue: 150 });
 *
 * @example
 * // Optional float with decimal precision
 * const schema = numberSchema('price', 'body', {
 *   required: false,
 *   minDecimal: 2,
 *   maxDecimal: 4,
 *   minValue: 0.01
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for formatting functions
 * @since Version 1.0.0
 * @see {@link numberHelper} for number validation utilities
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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
      options: (value, { req } = {}) => {
        if (value === null) return true;

        validateScope(req, requiredScope);

        return value !== undefined;
      },
      errorMessage: i18n.__mf('validations.invalid', { field: fieldName }),
    };
  }

  // Integer vs Float validation selection based on decimal constraints
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

  // Digit length validation (string representation)
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

  // Decimal precision validation + scope (when allowNull custom was not already set)
  if (minDecimal !== undefined || maxDecimal !== undefined) {
    const existingCustom = validationSchema.custom;
    validationSchema.custom = {
      options: (value, { req } = {}) => {
        if (existingCustom) {
          const result = existingCustom.options(value, { req });
          if (result !== true) return result;
        }

        if (value === null) return true;

        const parts = value.toString().split('.');
        const decimals = parts[1]?.length || 0;

        if (minDecimal !== undefined && decimals < minDecimal) {
          throw new Error(i18n.__mf('validations.minDecimal', { field: fieldName, minDecimal }));
        }

        if (maxDecimal !== undefined && decimals > maxDecimal) {
          throw new Error(i18n.__mf('validations.maxDecimal', { field: fieldName, maxDecimal }));
        }

        // Scope is validated here when there was no prior custom block,
        // or after decimal checks when there was one (allowNull path already ran it)
        if (!existingCustom) {
          validateScope(req, requiredScope);
        }

        return true;
      },
    };
  } else if (!allowNull && requiredScope) {
    // Neither allowNull nor decimal validation created a custom block —
    // we need one solely for the scope check
    validationSchema.custom = {
      options: (_, { req } = {}) => {
        validateScope(req, requiredScope);
        return true;
      },
    };
  }

  // Custom formatting functions chain
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
 * Generates validation schema for string fields
 *
 * @description Creates comprehensive string validation with length limits, character type restrictions,
 *              pattern matching, and case formatting
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {number} [options.minLength] - Minimum string length
 * @param {number} [options.maxLength] - Maximum string length
 * @param {RegExp} [options.pattern] - Regular expression pattern for validation
 * @param {boolean} [options.alphaOnly=false] - Allow only alphabetic characters
 * @param {boolean} [options.numericOnly=false] - Allow only numeric characters
 * @param {boolean} [options.alphanumericOnly=false] - Allow only alphanumeric characters
 * @param {boolean} [options.trim=true] - Automatically trim whitespace
 * @param {boolean} [options.toLowerCase=false] - Convert to lowercase
 * @param {boolean} [options.toUpperCase=false] - Convert to uppercase
 * @param {boolean} [options.capitalize=false] - Capitalize first letter
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Basic required string with length limits
 * const schema = stringSchema('username', 'body', {
 *   minLength: 3,
 *   maxLength: 30,
 *   alphanumericOnly: true
 * });
 *
 * @example
 * // Email validation with pattern and case normalization
 * const schema = stringSchema('email', 'body', {
 *   pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *   toLowerCase: true,
 *   trim: true
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for formatting functions
 * @since Version 1.0.0
 * @see {@link stringHelper} for string validation utilities
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // String preprocessing
  if (trim) {
    validationSchema.trim = true;
  }

  // Basic string type validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Length validation
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

  // Character type validation + scope check
  if (alphaOnly) {
    validationSchema.custom = {
      options: (value, { req } = {}) => {
        if (allowNull && value === null) return true;
        if (!stringHelper.isAlphaOnly(value)) {
          throw new Error(i18n.__mf('validations.alphaOnly', { field: fieldName }));
        }
        validateScope(req, requiredScope);
        return true;
      },
    };
  } else if (numericOnly) {
    validationSchema.custom = {
      options: (value, { req } = {}) => {
        if (allowNull && value === null) return true;
        if (!stringHelper.isNumericOnly(value)) {
          throw new Error(i18n.__mf('validations.numericOnly', { field: fieldName }));
        }
        validateScope(req, requiredScope);
        return true;
      },
    };
  } else if (alphanumericOnly) {
    validationSchema.custom = {
      options: (value, { req } = {}) => {
        if (allowNull && value === null) return true;
        if (!stringHelper.isAlphanumeric(value)) {
          throw new Error(i18n.__mf('validations.alphanumericOnly', { field: fieldName }));
        }
        validateScope(req, requiredScope);
        return true;
      },
    };
  } else if (requiredScope) {
    // No character-type custom block exists — create one solely for scope
    validationSchema.custom = {
      options: (value, { req } = {}) => {
        if (allowNull && value === null) return true;
        validateScope(req, requiredScope);
        return true;
      },
    };
  }

  // Pattern matching validation
  if (pattern) {
    validationSchema.matches = {
      options: pattern,
      errorMessage: i18n.__mf('validations.pattern', { field: fieldName }),
    };
  }

  // Case formatting
  if (toLowerCase) {
    validationSchema.toLowerCase = true;
  } else if (toUpperCase) {
    validationSchema.toUpperCase = true;
  }

  // Custom formatting functions including capitalization
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
 * Generates validation schema for enum/constrained value fields
 *
 * @description Creates validation for fields that must match one of predefined values
 *              with case sensitivity options
 * @param {string} name - Field identifier for internationalization
 * @param {Array<*>} allowedValues - Array of permitted values
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {boolean} [options.caseSensitive=true] - Whether value comparison is case-sensitive
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Case-sensitive status validation
 * const schema = inSchema('status', ['active', 'inactive', 'pending'], 'body');
 *
 * @example
 * // Case-insensitive category validation
 * const schema = inSchema('category', ['ELECTRONICS', 'BOOKS', 'CLOTHING'], 'body', {
 *   caseSensitive: false,
 *   required: false
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for value comparison
 * @since Version 1.0.0
 * @see {@link stringSchema} for more flexible string validation
 */
const inSchema = (
  name,
  allowedValues,
  location = 'body',
  { required = true, allowNull = false, formattingFunctions = [], caseSensitive = true, requiredScope } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Enum value validation with case sensitivity + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      let compareValues = allowedValues;
      let compareValue = value;

      // Case-insensitive comparison for strings
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

      validateScope(req, requiredScope);

      return true;
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for date fields
 *
 * @description Creates comprehensive date validation with format checking, range limits,
 *              and temporal constraints (past/future)
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {string} [options.format] - Date format pattern or 'ISO8601' for strict ISO validation
 * @param {string|Date} [options.minDate] - Minimum allowed date (inclusive)
 * @param {string|Date} [options.maxDate] - Maximum allowed date (inclusive)
 * @param {boolean} [options.futureOnly=false] - Restrict to future dates only
 * @param {boolean} [options.pastOnly=false] - Restrict to past dates only
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Future date validation for appointments
 * const schema = dateSchema('appointmentDate', 'body', {
 *   futureOnly: true,
 *   minDate: new Date()
 * });
 *
 * @example
 * // Birth date validation with reasonable range
 * const schema = dateSchema('birthDate', 'body', {
 *   pastOnly: true,
 *   maxDate: new Date(),
 *   minDate: new Date(1900, 0, 1)
 * });
 *
 * @complexity Time: O(1) for schema generation
 * @since Version 1.0.0
 * @see {@link dateRangeSchema} for validating date ranges between two fields
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Date format validation
  if (format) {
    validationSchema.matches = {
      options: format === 'ISO8601' ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ : new RegExp(format),
      errorMessage: i18n.__mf('validations.dateFormat', { field: fieldName, format }),
    };
  } else {
    // Default to strict ISO 8601 validation
    validationSchema.isISO8601 = {
      options: { strict: true },
      errorMessage: i18n.__mf('validations.date', { field: fieldName }),
    };
  }

  // Convert to Date object for further validation
  validationSchema.toDate = true;

  // Comprehensive date validation with temporal constraints + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(i18n.__mf('validations.date', { field: fieldName }));
      }

      const now = new Date();

      // Temporal constraints
      if (futureOnly && date <= now) {
        throw new Error(i18n.__mf('validations.futureDate', { field: fieldName }));
      }

      if (pastOnly && date >= now) {
        throw new Error(i18n.__mf('validations.pastDate', { field: fieldName }));
      }

      // Date range constraints
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

      validateScope(req, requiredScope);

      return true;
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for date range fields (start and end dates)
 *
 * @description Creates coordinated validation for start and end date pairs with logical
 *              consistency checks and range duration limits
 * @param {string} startDateName - Start date field identifier
 * @param {string} endDateName - End date field identifier
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether fields are required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {number} [options.maxDaysRange] - Maximum allowed days between start and end
 * @param {number} [options.minDaysRange] - Minimum required days between start and end
 * @param {string} [options.requiredScope] - Required scope for these fields
 * @returns {object} Express-validator compatible validation schema object with both fields
 *
 * @example
 * // Booking date range validation (1-30 days)
 * const schema = dateRangeSchema('checkIn', 'checkOut', 'body', {
 *   minDaysRange: 1,
 *   maxDaysRange: 30
 * });
 *
 * @example
 * // Project timeline validation
 * const schema = dateRangeSchema('startDate', 'endDate', 'body', {
 *   minDaysRange: 0, // Same day allowed
 *   futureOnly: true
 * });
 *
 * @complexity Time: O(1) for schema generation
 * @since Version 1.0.0
 * @see {@link dateSchema} for individual date field validation
 */
const dateRangeSchema = (
  startDateName,
  endDateName,
  location = 'body',
  { required = true, allowNull = false, maxDaysRange, minDaysRange, requiredScope } = {}
) => {
  const startFieldName = getFieldName(startDateName);
  const endFieldName = getFieldName(endDateName);

  const schema = {};

  // Generate individual date schemas for both fields.
  // requiredScope is intentionally passed here so each field's own dateSchema
  // custom block will run the scope guard independently — if either date is
  // submitted without the scope the request is rejected before range logic runs.
  schema[startDateName] = dateSchema(startDateName, location, { required, allowNull, requiredScope });
  schema[endDateName] = dateSchema(endDateName, location, { required, allowNull, requiredScope });

  // Override end-date custom with range validation.
  // Scope was already checked by the dateSchema custom block on startDateName;
  // we still call it here for defence-in-depth (the override replaces dateSchema's custom).
  schema[endDateName].custom = {
    options: (endDateValue, { req } = {}) => {
      const startDateValue = req?.[location]?.[startDateName];

      // Handle null values if allowed
      if ((allowNull && startDateValue === null) || (allowNull && endDateValue === null)) {
        return true;
      }

      const startDate = new Date(startDateValue);
      const endDate = new Date(endDateValue);

      // Skip validation if dates are invalid (individual validations will catch this)
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return true;
      }

      // Logical consistency: end date must be after start date
      if (endDate < startDate) {
        throw new Error(
          i18n.__mf('validations.dateRange', {
            startField: startFieldName,
            endField: endFieldName,
          })
        );
      }

      // Calculate day difference (inclusive of both start and end)
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      // Range duration validation
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

      // Defence-in-depth: scope guard runs even though startDateName's schema
      // already checked it, because this custom block completely replaces the
      // one that dateSchema generated for endDateName.
      validateScope(req, requiredScope);

      return true;
    },
  };

  return schema;
};

/**
 * Generates validation schema for array fields
 *
 * @description Creates comprehensive array validation with length limits, item type checking,
 *              enum constraints, and uniqueness requirements
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {number} [options.minLength] - Minimum array length
 * @param {number} [options.maxLength] - Maximum array length
 * @param {string} [options.itemType] - Required type for array items: 'string', 'number', 'boolean'
 * @param {Array<*>} [options.allowedValues] - Permitted values for array items
 * @param {boolean} [options.uniqueItems=false] - Whether array items must be unique
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // String array with uniqueness
 * const schema = arraySchema('tags', 'body', {
 *   itemType: 'string',
 *   minLength: 1,
 *   maxLength: 10,
 *   uniqueItems: true
 * });
 *
 * @example
 * // Number array with allowed values
 * const schema = arraySchema('scores', 'body', {
 *   itemType: 'number',
 *   allowedValues: [1, 2, 3, 4, 5],
 *   minLength: 3,
 *   maxLength: 5
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for array validation
 * @since Version 1.0.0
 * @see {@link arrayStringSchema} for comma-separated string to array conversion
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Array type validation
  validationSchema.isArray = {
    errorMessage: i18n.__mf('validations.array', { field: fieldName }),
  };

  // Comprehensive array content validation + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;
      if (!Array.isArray(value)) return true;

      // Array length validation
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

      // Uniqueness validation
      if (uniqueItems) {
        const uniqueValues = [...new Set(value)];
        if (uniqueValues.length !== value.length) {
          throw new Error(i18n.__mf('validations.arrayUniqueItems', { field: fieldName }));
        }
      }

      validateScope(req, requiredScope);

      return true;
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for boolean fields
 *
 * @description Creates boolean validation with strict/lenient parsing options
 *              and custom formatting
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {boolean} [options.strictMode=false] - Whether to use strict boolean validation
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Strict boolean validation (only true/false accepted)
 * const schema = booleanSchema('active', 'body', { strictMode: true });
 *
 * @example
 * // Lenient boolean validation (accepts 'true', 'false', 1, 0, etc.)
 * const schema = booleanSchema('newsletter', 'body', {
 *   required: false,
 *   strictMode: false
 * });
 *
 * @complexity Time: O(1) for schema generation
 * @since Version 1.0.0
 * @see {@link utilitiesHelper.toBoolean} for lenient boolean conversion logic
 */
const booleanSchema = (
  name,
  location = 'body',
  { required = true, allowNull = false, formattingFunctions = [], strictMode = false, requiredScope } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Boolean validation strategy
  if (strictMode) {
    // Strict validation: only accept actual boolean values
    validationSchema.isBoolean = {
      options: { strict: true },
      errorMessage: i18n.__mf('validations.boolean', { field: fieldName }),
    };
  } else {
    // Lenient validation: convert string/number to boolean
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

  // Scope check — booleanSchema has no pre-existing custom block so we always
  // add one when a scope is required
  if (requiredScope) {
    validationSchema.custom = {
      options: (value, { req } = {}) => {
        if (allowNull && value === null) return true;
        validateScope(req, requiredScope);
        return true;
      },
    };
  }

  // Custom formatting with existing sanitizer integration
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
 * Generates validation schema for object fields
 *
 * @description Creates comprehensive object validation with property requirements,
 *              type checking, size limits, and strict property enforcement
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {Array<string>} [options.requiredProperties=[]] - Object properties that must be present
 * @param {object} [options.propertyTypes={}] - Type requirements for specific properties
 * @param {number} [options.minProperties] - Minimum number of properties required
 * @param {number} [options.maxProperties] - Maximum number of properties allowed
 * @param {boolean} [options.strictProperties=false] - Whether to enforce only allowed properties
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // User profile object validation
 * const schema = objectSchema('profile', 'body', {
 *   requiredProperties: ['firstName', 'lastName', 'email'],
 *   propertyTypes: {
 *     firstName: 'string',
 *     lastName: 'string',
 *     email: 'string',
 *     age: 'number'
 *   },
 *   strictProperties: true
 * });
 *
 * @example
 * // Flexible metadata object
 * const schema = objectSchema('metadata', 'body', {
 *   required: false,
 *   minProperties: 1,
 *   maxProperties: 10
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for property validation
 * @since Version 1.0.0
 * @see {@link utilitiesHelper.isPlainObject} for object type detection
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Comprehensive object structure validation + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      // Plain object validation
      if (!utilitiesHelper.isPlainObject(value)) {
        throw new Error(i18n.__mf('validations.object', { field: fieldName }));
      }

      const objectKeys = Object.keys(value);

      // Property count validation
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

      // Property type validation
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

      // Strict properties validation (no extra properties allowed)
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

      validateScope(req, requiredScope);

      return true;
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for password fields
 *
 * @description Creates comprehensive password validation with configurable complexity rules
 *              and development mode overrides
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {number} [options.minLength=8] - Minimum password length
 * @param {number} [options.maxLength=128] - Maximum password length
 * @param {boolean} [options.requireUppercase=true] - Require uppercase letters
 * @param {boolean} [options.requireLowercase=true] - Require lowercase letters
 * @param {boolean} [options.requireNumbers=true] - Require numeric characters
 * @param {boolean} [options.requireSpecialChars=true] - Require special characters
 * @param {string} [options.specialChars='!@#$%^&*()_+-=[]{}|;:,.<>?'] - Allowed special characters
 * @param {boolean} [options.noSpaces=true] - Disallow whitespace characters
 * @param {Array<string|RegExp>} [options.forbiddenPatterns=[]] - Patterns to reject
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Standard production password rules
 * const schema = passwordSchema('password', 'body');
 *
 * @example
 * // Custom password policy
 * const schema = passwordSchema('password', 'body', {
 *   minLength: 12,
 *   requireSpecialChars: true,
 *   forbiddenPatterns: ['password', '123456', new RegExp('companyname', 'i')]
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for pattern checking
 * @since Version 1.0.0
 * @note Development mode automatically relaxes all password requirements for testing
 * @see {@link isDevelopmentMode} for development environment detection
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Development mode overrides - relax all password requirements for testing
  if (isDevelopmentMode(true)) {
    minLength = 1;
    maxLength = 128;
    requireUppercase = false;
    requireLowercase = false;
    requireNumbers = false;
    requireSpecialChars = false;
    noSpaces = false;
    forbiddenPatterns = [];
  }

  // Optional field configuration
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

  // Basic string validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Password length validation
  validationSchema.isLength = {
    options: { min: minLength, max: maxLength },
    errorMessage: i18n.__mf('validations.passwordLength', {
      field: fieldName,
      min: minLength,
      max: maxLength,
    }),
  };

  // Comprehensive password complexity validation + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.string', { field: fieldName }));
      }

      // Whitespace validation
      if (noSpaces && /\s/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordNoSpaces', { field: fieldName }));
      }

      // Character type requirements
      if (requireUppercase && !/[A-Z]/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordUppercase', { field: fieldName }));
      }

      if (requireLowercase && !/[a-z]/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordLowercase', { field: fieldName }));
      }

      if (requireNumbers && !/\d/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordNumbers', { field: fieldName }));
      }

      // Special character requirements
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

      // Forbidden pattern detection
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

      validateScope(req, requiredScope);

      return true;
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for comma-separated string to array conversion
 *
 * @description Creates validation for string fields that should be converted to arrays,
 *              with comprehensive array validation after conversion
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {string} [options.separator=','] - Character used to separate values
 * @param {number} [options.minLength] - Minimum array length after conversion
 * @param {number} [options.maxLength] - Maximum array length after conversion
 * @param {string} [options.itemType] - Required type for array items: 'string', 'number'
 * @param {Array<*>} [options.allowedValues] - Permitted values for array items
 * @param {boolean} [options.uniqueItems=true] - Whether array items must be unique
 * @param {boolean} [options.trimItems=true] - Whether to trim whitespace from items
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Tags from comma-separated string
 * const schema = arrayStringSchema('tags', 'body', {
 *   itemType: 'string',
 *   uniqueItems: true,
 *   minLength: 1,
 *   maxLength: 5
 * });
 *
 * @example
 * // Number list from semicolon-separated string
 * const schema = arrayStringSchema('scores', 'body', {
 *   separator: ';',
 *   itemType: 'number',
 *   trimItems: true
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for string splitting and validation
 * @since Version 1.0.0
 * @see {@link arraySchema} for direct array validation
 * @see {@link utilitiesHelper.stringToArray} for string parsing logic
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // String to array conversion with options
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

  // Array type validation
  validationSchema.isArray = {
    errorMessage: i18n.__mf('validations.array', { field: fieldName }),
  };

  // Comprehensive array content validation after conversion + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;
      if (!Array.isArray(value)) return true;

      // Array length validation
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

      validateScope(req, requiredScope);

      return true;
    },
  };

  // Custom formatting with existing sanitizer integration
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
 * Generates validation schema for URL/link fields
 *
 * @description Creates comprehensive URL validation with protocol restrictions,
 *              domain whitelisting, and TLD requirements
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {Array<string>} [options.allowedProtocols=['http','https']] - Permitted URL protocols
 * @param {Array<string>} [options.allowedDomains] - Whitelisted domain names
 * @param {boolean} [options.requireTLD=true] - Whether to require top-level domain
 * @param {boolean} [options.trim=true] - Automatically trim whitespace
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Standard web URL validation
 * const schema = linkSchema('website', 'body');
 *
 * @example
 * // Internal URL validation with domain restriction
 * const schema = linkSchema('internalLink', 'body', {
 *   allowedDomains: ['company.com', 'internal.company.com'],
 *   allowedProtocols: ['https']
 * });
 *
 * @complexity Time: O(1) for schema generation
 * @since Version 1.0.0
 * @see {@link stringHelper.isURL} for URL format validation
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // URL preprocessing
  if (trim) {
    validationSchema.trim = true;
  }

  // Basic string validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Comprehensive URL validation + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      // Basic URL format validation
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

        // Domain whitelist validation
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

        // TLD requirement validation
        if (requireTLD) {
          if (!url.hostname.includes('.')) {
            throw new Error(i18n.__mf('validations.urlTLD', { field: fieldName }));
          }
        }

        validateScope(req, requiredScope);

        return true;
      } catch (error) {
        // Re-throw validation errors directly without wrapping
        if (
          error.message &&
          (error.message.includes(i18n.__('error.user_not_found')) ||
            error.message.includes(i18n.__('error.scopes_invalid')) ||
            error.message.includes(i18n.__('error.access_denied')))
        ) {
          throw error;
        }
        cerror('helpers/validations/common.schemas.js.linkSchema', error);
        throw new Error(i18n.__mf('validations.url', { field: fieldName }));
      }
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for JWT token fields
 *
 * @description Creates comprehensive JWT validation with structural checks,
 *              payload validation, claim requirements, and expiry verification
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {boolean} [options.validatePayload=false] - Whether to validate JWT payload structure
 * @param {Array<string>} [options.requiredClaims=[]] - Required JWT claims
 * @param {boolean} [options.checkExpiry=false] - Whether to check token expiration
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Basic JWT structure validation
 * const schema = jwtSchema('token', 'body');
 *
 * @example
 * // Full JWT validation with claims and expiry
 * const schema = jwtSchema('authToken', 'body', {
 *   validatePayload: true,
 *   requiredClaims: ['sub', 'iat', 'exp'],
 *   checkExpiry: true
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for claim validation
 * @since Version 1.0.0
 * @note This validates JWT structure but does NOT verify cryptographic signatures
 * @see {@link securityHelper} for JWT signature verification utilities
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Basic string validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Comprehensive JWT validation + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      // Basic JWT structure validation (3 parts separated by dots)
      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }

      const parts = value.split('.');
      if (parts.length !== 3) {
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }

      try {
        // Decode and validate payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        if (validatePayload) {
          // Payload structure validation
          if (!utilitiesHelper.isPlainObject(payload)) {
            throw new Error(i18n.__mf('validations.jwtPayload', { field: fieldName }));
          }

          // Required claims validation
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

          // Expiration validation
          if (checkExpiry && payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
              throw new Error(i18n.__mf('validations.jwtExpired', { field: fieldName }));
            }
          }
        }

        validateScope(req, requiredScope);

        return true;
      } catch (error) {
        // Re-throw validation errors directly without wrapping
        if (
          error.message &&
          (error.message.includes(i18n.__('error.user_not_found')) ||
            error.message.includes(i18n.__('error.scopes_invalid')) ||
            error.message.includes(i18n.__('error.access_denied')))
        ) {
          throw error;
        }
        cerror('helpers/validations/common.schemas.js.jwtSchema', error);
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for UUID fields
 *
 * @description Creates comprehensive UUID validation with version support,
 *              format flexibility, and case sensitivity options
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {Array<number>} [options.versions=[1,2,3,4,5]] - Allowed UUID versions
 * @param {boolean} [options.caseSensitive=false] - Whether validation is case-sensitive
 * @param {boolean} [options.requireHyphens=true] - Whether hyphens are required
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Standard UUID v4 validation
 * const schema = uuidSchema('id', 'body', { versions: [4] });
 *
 * @example
 * // Flexible UUID validation (any version, with or without hyphens)
 * const schema = uuidSchema('legacyId', 'body', {
 *   requireHyphens: false,
 *   versions: [1, 4, 5]
 * });
 *
 * @complexity Time: O(1) for schema generation
 * @since Version 1.0.0
 * @see RFC 4122 for UUID specification details
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Basic string validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // Comprehensive UUID validation + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.uuid', { field: fieldName }));
      }

      const withoutHyphens = value.replace(/-/g, '');

      // UUID format validation with hyphen flexibility
      if (requireHyphens) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          throw new Error(i18n.__mf('validations.uuid', { field: fieldName }));
        }
      } else {
        const uuidRegexWithHyphens = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const uuidRegexWithoutHyphens = /^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i;

        if (!uuidRegexWithHyphens.test(value) && !uuidRegexWithoutHyphens.test(value)) {
          throw new Error(i18n.__mf('validations.uuid', { field: fieldName }));
        }
      }

      // UUID version validation
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

      validateScope(req, requiredScope);

      return true;
    },
  };

  // Custom formatting functions
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
 * Generates validation schema for HTML content fields
 *
 * @description Creates comprehensive HTML validation with XSS protection,
 *              tag/attribute whitelisting, and content length limits
 * @param {string} name - Field identifier for internationalization
 * @param {string} [location='body'] - Request location: 'body', 'query', 'params', 'cookies'
 * @param {object} [options] - Validation configuration options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {boolean} [options.allowNull=false] - Whether null values are allowed
 * @param {Array<Function>} [options.formattingFunctions=[]] - Custom sanitization functions
 * @param {number} [options.minLength] - Minimum HTML content length
 * @param {number} [options.maxLength=10000] - Maximum HTML content length
 * @param {boolean} [options.stripDangerousTags=true] - Whether to remove dangerous HTML tags
 * @param {Array<string>} [options.allowedTags=['p','br','strong','em','u','ul','ol','li','h1','h2','h3','h4','h5','h6']] - Permitted HTML tags
 * @param {Array<string>} [options.allowedAttributes=['class','style']] - Permitted HTML attributes
 * @param {string} [options.requiredScope] - Required scope for this field
 * @returns {object} Express-validator compatible validation schema
 *
 * @example
 * // Basic HTML validation with security
 * const schema = htmlSchema('content', 'body');
 *
 * @example
 * // Rich text validation with custom allowed tags
 * const schema = htmlSchema('articleBody', 'body', {
 *   allowedTags: ['p', 'br', 'strong', 'em', 'a', 'img'],
 *   allowedAttributes: ['class', 'style', 'href', 'src', 'alt'],
 *   maxLength: 50000
 * });
 *
 * @complexity Time: O(1) for schema generation, O(n) for HTML sanitization
 * @since Version 1.0.0
 * @see {@link securityHelper} for XSS detection and HTML sanitization
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  // Optional field configuration
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

  // Basic string validation
  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  // HTML content length validation
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

  // XSS detection + scope check
  validationSchema.custom = {
    options: (value, { req } = {}) => {
      if (allowNull && value === null) return true;

      // XSS attempt detection with security logging
      if (stripDangerousTags && securityHelper.detectXSS(value)) {
        securityHelper.logSecurityEvent('HTML_XSS_ATTEMPT', { field: name }, THREAT_LEVELS.HIGH);
        throw new Error(i18n.__mf('validations.htmlSecurity', { field: fieldName }));
      }

      validateScope(req, requiredScope);

      return true;
    },
  };

  // HTML sanitization with custom formatting
  validationSchema.customSanitizer = {
    options: (value) => {
      if (allowNull && value === null) return null;

      let sanitized = value;

      // Apply custom formatting functions
      sanitized = formattingFunctions.reduce((acc, func) => {
        return typeof func === 'function' ? func(acc) : acc;
      }, sanitized);

      // Apply HTML sanitization
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

// =============================================================================
// MODULE EXPORTS
// =============================================================================
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
