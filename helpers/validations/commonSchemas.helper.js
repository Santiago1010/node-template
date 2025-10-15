// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const numberHelper = require('../../utils/numbers.util');
const securityHelper = require('../security.helper');
const stringHelper = require('../../utils/strings.util');
const utilitiesHelper = require('../../utils/utilities.util');
const i18n = require('../../config/i18n');
const { THREAT_LEVELS } = require('../../utils/constants.util');
const { cerror, isDevelopmentMode } = require('../debug.helper');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

const validateSecurityLevel = (allowNull, value, fieldName, minSecurityLevel, req) => {
  if (parseInt(minSecurityLevel) === 0) return true;

  if (allowNull && value === null) return true;

  const userSecurityLevel = req?.user?.securityLevel || 0;

  if (userSecurityLevel < minSecurityLevel) {
    throw new Error(
      i18n.__mf('validations.insufficient_security_level', {
        field: fieldName,
        required: minSecurityLevel,
        current: userSecurityLevel,
      })
    );
  }

  return true;
};

// =============================================================================
// SCHEMA GENERATORS
// =============================================================================

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  if (allowNull) {
    validationSchema.custom = {
      options: (value) => {
        if (value === null) return true;
        return value !== undefined;
      },
      errorMessage: i18n.__mf('validations.invalid', { field: fieldName }),
    };
  }

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

  if (minDecimal !== undefined || maxDecimal !== undefined) {
    const existingCustom = validationSchema.custom;
    validationSchema.custom = {
      options: (value, { req }) => {
        if (existingCustom) {
          const result = existingCustom.options(value);
          if (result !== true) return result;
        }

        validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

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
  } else if (minSecurityLevel !== 0) {
    const existingCustom = validationSchema.custom;
    validationSchema.custom = {
      options: (value, { req }) => {
        if (existingCustom) {
          const result = existingCustom.options(value);
          if (result !== true) return result;
        }

        return validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);
      },
    };
  }

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  if (trim) {
    validationSchema.trim = true;
  }

  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

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

  if (alphaOnly) {
    validationSchema.custom = {
      options: (value, { req }) => {
        validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

        if (allowNull && value === null) return true;
        if (!stringHelper.isAlphaOnly(value)) {
          throw new Error(i18n.__mf('validations.alphaOnly', { field: fieldName }));
        }
        return true;
      },
    };
  } else if (numericOnly) {
    validationSchema.custom = {
      options: (value, { req }) => {
        validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

        if (allowNull && value === null) return true;
        if (!stringHelper.isNumericOnly(value)) {
          throw new Error(i18n.__mf('validations.numericOnly', { field: fieldName }));
        }
        return true;
      },
    };
  } else if (alphanumericOnly) {
    validationSchema.custom = {
      options: (value, { req }) => {
        validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

        if (allowNull && value === null) return true;
        if (!stringHelper.isAlphanumeric(value)) {
          throw new Error(i18n.__mf('validations.alphanumericOnly', { field: fieldName }));
        }
        return true;
      },
    };
  } else if (minSecurityLevel !== 0) {
    validationSchema.custom = {
      options: (value, { req }) => {
        return validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);
      },
    };
  }

  if (pattern) {
    validationSchema.matches = {
      options: pattern,
      errorMessage: i18n.__mf('validations.pattern', { field: fieldName }),
    };
  }

  if (toLowerCase) {
    validationSchema.toLowerCase = true;
  } else if (toUpperCase) {
    validationSchema.toUpperCase = true;
  }

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

const inSchema = (
  name,
  allowedValues,
  location = 'body',
  { required = true, allowNull = false, formattingFunctions = [], caseSensitive = true, minSecurityLevel = 1 } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.toDate = true;

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(i18n.__mf('validations.date', { field: fieldName }));
      }

      const now = new Date();

      if (futureOnly && date <= now) {
        throw new Error(i18n.__mf('validations.futureDate', { field: fieldName }));
      }

      if (pastOnly && date >= now) {
        throw new Error(i18n.__mf('validations.pastDate', { field: fieldName }));
      }

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

const dateRangeSchema = (
  startDateName,
  endDateName,
  location = 'body',
  { required = true, allowNull = false, maxDaysRange, minDaysRange, minSecurityLevel = 1 } = {}
) => {
  const startFieldName = getFieldName(startDateName);
  const endFieldName = getFieldName(endDateName);

  const schema = {};

  schema[startDateName] = dateSchema(startDateName, location, { required, allowNull, minSecurityLevel });
  schema[endDateName] = dateSchema(endDateName, location, { required, allowNull, minSecurityLevel });

  schema[endDateName].custom = {
    options: (endDateValue, { req }) => {
      const startDateValue = req[location][startDateName];

      if ((allowNull && startDateValue === null) || (allowNull && endDateValue === null)) {
        return true;
      }

      const startDate = new Date(startDateValue);
      const endDate = new Date(endDateValue);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return true;
      }

      if (endDate < startDate) {
        throw new Error(
          i18n.__mf('validations.dateRange', {
            startField: startFieldName,
            endField: endFieldName,
          })
        );
      }

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.isArray = {
    errorMessage: i18n.__mf('validations.array', { field: fieldName }),
  };

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;
      if (!Array.isArray(value)) return true;

      if (minLength !== undefined && value.length < minLength) {
        throw new Error(i18n.__mf('validations.arrayMinLength', { field: fieldName, minLength }));
      }

      if (maxLength !== undefined && value.length > maxLength) {
        throw new Error(i18n.__mf('validations.arrayMaxLength', { field: fieldName, maxLength }));
      }

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

      if (uniqueItems) {
        const uniqueValues = [...new Set(value)];
        if (uniqueValues.length !== value.length) {
          throw new Error(i18n.__mf('validations.arrayUniqueItems', { field: fieldName }));
        }
      }

      return true;
    },
  };

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

const booleanSchema = (
  name,
  location = 'body',
  { required = true, allowNull = false, formattingFunctions = [], strictMode = false, minSecurityLevel = 1 } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  if (minSecurityLevel !== 0) {
    validationSchema.custom = {
      options: (value, { req }) => {
        return validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);
      },
    };
  }

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;

      if (!utilitiesHelper.isPlainObject(value)) {
        throw new Error(i18n.__mf('validations.object', { field: fieldName }));
      }

      const objectKeys = Object.keys(value);

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

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

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  validationSchema.isLength = {
    options: { min: minLength, max: maxLength },
    errorMessage: i18n.__mf('validations.passwordLength', {
      field: fieldName,
      min: minLength,
      max: maxLength,
    }),
  };

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.string', { field: fieldName }));
      }

      if (noSpaces && /\s/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordNoSpaces', { field: fieldName }));
      }

      if (requireUppercase && !/[A-Z]/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordUppercase', { field: fieldName }));
      }

      if (requireLowercase && !/[a-z]/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordLowercase', { field: fieldName }));
      }

      if (requireNumbers && !/\d/.test(value)) {
        throw new Error(i18n.__mf('validations.passwordNumbers', { field: fieldName }));
      }

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.isArray = {
    errorMessage: i18n.__mf('validations.array', { field: fieldName }),
  };

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;
      if (!Array.isArray(value)) return true;

      if (minLength !== undefined && value.length < minLength) {
        throw new Error(i18n.__mf('validations.arrayMinLength', { field: fieldName, minLength }));
      }

      if (maxLength !== undefined && value.length > maxLength) {
        throw new Error(i18n.__mf('validations.arrayMaxLength', { field: fieldName, maxLength }));
      }

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  if (trim) {
    validationSchema.trim = true;
  }

  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;

      if (!stringHelper.isURL(value)) {
        throw new Error(i18n.__mf('validations.url', { field: fieldName }));
      }

      try {
        const url = new URL(value);

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }

      const parts = value.split('.');
      if (parts.length !== 3) {
        throw new Error(i18n.__mf('validations.jwt', { field: fieldName }));
      }

      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

        if (validatePayload) {
          if (!utilitiesHelper.isPlainObject(payload)) {
            throw new Error(i18n.__mf('validations.jwtPayload', { field: fieldName }));
          }

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  if (!caseSensitive) {
    validationSchema.toLowerCase = true;
  }

  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;

      if (!stringHelper.isValidString(value)) {
        throw new Error(i18n.__mf('validations.uuid', { field: fieldName }));
      }

      const withoutHyphens = value.replace(/-/g, '');

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);
  const validationSchema = { in: location };

  if (!required) {
    validationSchema.optional = { options: { nullable: allowNull, checkFalsy: false } };
  }

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

  validationSchema.isString = {
    errorMessage: i18n.__mf('validations.string', { field: fieldName }),
  };

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

  validationSchema.custom = {
    options: (value, { req }) => {
      validateSecurityLevel(allowNull, value, fieldName, minSecurityLevel, req);

      if (allowNull && value === null) return true;

      if (stripDangerousTags && securityHelper.detectXSS(value)) {
        securityHelper.logSecurityEvent('HTML_XSS_ATTEMPT', { field: name }, THREAT_LEVELS.HIGH);
        throw new Error(i18n.__mf('validations.htmlSecurity', { field: fieldName }));
      }

      return true;
    },
  };

  validationSchema.customSanitizer = {
    options: (value) => {
      if (allowNull && value === null) return null;

      let sanitized = value;

      sanitized = formattingFunctions.reduce((acc, func) => {
        return typeof func === 'function' ? func(acc) : acc;
      }, sanitized);

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
