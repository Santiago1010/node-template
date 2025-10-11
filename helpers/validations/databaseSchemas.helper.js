// =============================================================================
// DATABASE SCHEMAS - Complete validation schemas for express-validator
// =============================================================================
//
// This module provides validation functions and utilities for working
// with database schemas using express-validator. Includes validation
// of IDs, data existence checks, and model attribute verification.
//
// Main functions:
// - idSchema: Complete ID validation with database verification
// - validateUniqueField: Validation of unique fields
// - validateMultipleIds: Validation of multiple IDs (array or string)
// - validateModelAttributes: Verification of model attribute existence
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../../config/i18n');
const { convertToNumber } = require('../../utils/numbers.util');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets localized field name using i18n
 * @param {string} name - Field name
 * @returns {string} Localized field name or original name with prefix
 */
const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

/**
 * Converts comma-separated string or array into clean array
 * @param {string|Array} value - Value to convert
 * @returns {Array} Array of cleaned values
 */
const parseToArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  return [];
};

/**
 * Creates validation schema for IDs with database verification
 * @param {string} name - Field name for i18n
 * @param {string} location - Field location ('body', 'params', 'query')
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether field is required (default: true)
 * @param {Array} options.formattingFunctions - Formatting functions to apply
 * @param {Object} options.model - Sequelize model for validation
 * @returns {Object} Validation schema for express-validator
 */
const idSchema = (name, location = 'body', { required = true, formattingFunctions = [], model }) => {
  const fieldName = getFieldName(name);
  const validationSchema = {
    in: location,
    custom: {
      options: async (value) => {
        const data = await model.findByPk(value);
        return data !== null;
      },
      errorMessage: i18n.__mf('validations.not_exists', { field: fieldName }),
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

  // Add convertToNumber by default if not present
  if (!formattingFunctions.includes(convertToNumber)) {
    formattingFunctions.push(convertToNumber);
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

/**
 * Validates if a value exists in specific database column
 * @param {string} name - Field name for i18n messages
 * @param {string} location - Field location ('body', 'params', 'query')
 * @param {Object} options - Configuration options
 * @param {Object} options.model - Sequelize model
 * @param {string} options.field - Database column name
 * @param {boolean} options.shouldExist - If true, validates existence; if false, validates non-existence
 * @param {boolean} options.required - Whether field is required (default: true)
 * @param {*} options.excludeValue - Value to exclude from validation (useful for updates)
 * @returns {Object} Validation schema for express-validator
 */
const validateUniqueField = (
  name,
  location = 'body',
  { model, field, shouldExist = false, required = true, excludeValue = null }
) => {
  const fieldName = getFieldName(name);

  const validationSchema = {
    in: location,
    custom: {
      options: async (value) => {
        const whereClause = { [field]: value };

        // Exclude specific value if provided (useful for updates)
        if (excludeValue !== null) {
          whereClause[field] = {
            [model.sequelize.Sequelize.Op.and]: [
              { [model.sequelize.Sequelize.Op.eq]: value },
              { [model.sequelize.Sequelize.Op.ne]: excludeValue },
            ],
          };
        }

        const existingData = await model.findOne({ where: whereClause });
        const exists = existingData !== null;

        if (shouldExist && !exists) {
          throw new Error(i18n.__mf('validations.not_exists', { field: fieldName }));
        }

        if (!shouldExist && exists) {
          throw new Error(i18n.__mf('validations.already_exists', { field: fieldName }));
        }

        return true;
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

  return validationSchema;
};

/**
 * Validates multiple IDs that can come as array or comma-separated string
 * @param {string} name - Field name for i18n messages
 * @param {string} location - Field location ('body', 'params', 'query')
 * @param {Object} options - Configuration options
 * @param {Object} options.model - Sequelize model
 * @param {boolean} options.required - Whether field is required (default: true)
 * @param {number} options.minLength - Minimum number of required IDs
 * @param {number} options.maxLength - Maximum number of allowed IDs
 * @returns {Object} Validation schema for express-validator
 */
const validateMultipleIds = (name, location = 'body', { model, required = true, minLength = 1, maxLength = null }) => {
  const fieldName = getFieldName(name);

  const validationSchema = {
    in: location,
    customSanitizer: {
      options: (value) => {
        // Convert to array and clean values
        const idsArray = parseToArray(value);
        // Convert to numbers if necessary
        return idsArray.map((id) => convertToNumber(id)).filter((id) => !isNaN(id));
      },
    },
    custom: {
      options: async (value) => {
        const idsArray = Array.isArray(value) ? value : parseToArray(value);

        // Validate minimum length
        if (idsArray.length < minLength) {
          throw new Error(
            i18n.__mf('validations.min_length', {
              field: fieldName,
              min: minLength,
            })
          );
        }

        // Validate maximum length
        if (maxLength !== null && idsArray.length > maxLength) {
          throw new Error(
            i18n.__mf('validations.max_length', {
              field: fieldName,
              max: maxLength,
            })
          );
        }

        // Verify all IDs exist in database
        const existingRecords = await model.findAll({
          where: {
            id: {
              [model.sequelize.Sequelize.Op.in]: idsArray,
            },
          },
          attributes: ['id'],
        });

        const existingIds = existingRecords.map((record) => record.id);
        const nonExistentIds = idsArray.filter((id) => !existingIds.includes(id));

        if (nonExistentIds.length > 0) {
          throw new Error(
            i18n.__mf('validations.ids_not_found', {
              field: fieldName,
              ids: nonExistentIds.join(', '),
            })
          );
        }

        return true;
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

  return validationSchema;
};

/**
 * Validates that specified attributes exist in the model
 * @param {string} name - Field name for i18n messages
 * @param {string} location - Field location ('body', 'params', 'query')
 * @param {Object} options - Configuration options
 * @param {Object} options.model - Sequelize model
 * @param {boolean} options.required - Whether field is required (default: true)
 * @param {Array} options.allowedAttributes - List of allowed attributes (optional)
 * @returns {Object} Validation schema for express-validator
 */
const validateModelAttributes = (name, location = 'body', { model, required = true, allowedAttributes = null }) => {
  const fieldName = getFieldName(name);

  const validationSchema = {
    in: location,
    customSanitizer: {
      options: (value) => {
        // Convert to array and clean values
        return parseToArray(value);
      },
    },
    custom: {
      options: (value) => {
        const attributesArray = Array.isArray(value) ? value : parseToArray(value);

        if (attributesArray.length === 0) {
          throw new Error(i18n.__mf('validations.required', { field: fieldName }));
        }

        // Get all model attributes
        const modelAttributes = Object.keys(model.rawAttributes);

        // Use allowed attributes list if specified
        const validAttributes = allowedAttributes || modelAttributes;

        // Verify all requested attributes exist
        const invalidAttributes = attributesArray.filter((attr) => !validAttributes.includes(attr));

        if (invalidAttributes.length > 0) {
          throw new Error(
            i18n.__mf('validations.invalid_attributes', {
              field: fieldName,
              attributes: invalidAttributes.join(', '),
              validAttributes: validAttributes.join(', '),
            })
          );
        }

        return true;
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

  return validationSchema;
};

/**
 * Validates a value against the primary key or unique fields (non-composite) of a model.
 *
 * Automatically detects:
 *  - primary key name
 *  - single-field unique constraints (both attribute-level unique: true and indexes with unique and fields.length === 1)
 *
 * Options:
 *  - model (required) : Sequelize model
 *  - required (default true)
 *  - formattingFunctions (array of functions to sanitize the value)
 *  - shouldExist (default true) : if true validates that the value exists; if false validates that it does NOT exist
 *  - excludeValue (PK value to exclude, useful for updates)
 *  - allowPrimaryKey (default true)
 *  - allowUniqueFields (default true)
 *
 * Usage example:
 *  validateValueAgainstModel('identifier', 'body', { model: MyModel })
 */
const validateValueAgainstModel = (
  name,
  location = 'body',
  {
    model,
    required = true,
    formattingFunctions = [],
    shouldExist = true,
    excludeValue = null,
    allowPrimaryKey = true,
    allowUniqueFields = true,
  } = {}
) => {
  const fieldName = getFieldName(name);

  if (!model) {
    throw new Error('validateValueAgainstModel requires a Sequelize model in options.model');
  }

  // Determine primary key
  let primaryKeyAttr = null;
  if (typeof model.primaryKeyAttribute === 'string' && model.primaryKeyAttribute.length > 0) {
    primaryKeyAttr = model.primaryKeyAttribute;
  } else if (Array.isArray(model.primaryKeyAttributes) && model.primaryKeyAttributes.length > 0) {
    primaryKeyAttr = model.primaryKeyAttributes[0];
  } else {
    // Fallback: search in rawAttributes
    for (const attr of Object.keys(model.rawAttributes || {})) {
      if (model.rawAttributes[attr].primaryKey) {
        primaryKeyAttr = attr;
        break;
      }
    }
  }

  // Determine single-field unique constraints
  const uniqueAttrsSet = new Set();

  // 1) Attribute-level unique: true
  const rawAttrs = model.rawAttributes || {};
  for (const attrName of Object.keys(rawAttrs)) {
    const attr = rawAttrs[attrName];
    if (attr && attr.unique === true) {
      uniqueAttrsSet.add(attrName);
    }
  }

  // 2) Indexes defined in model.options.indexes with unique: true and single field
  const indexes = (model.options && model.options.indexes) || [];
  for (const idx of indexes) {
    if (idx.unique && Array.isArray(idx.fields) && idx.fields.length === 1) {
      // idx.fields may contain objects { name: 'col' } or strings
      const f = idx.fields[0];
      const fname =
        typeof f === 'string' ? f : f && (f.attribute || f.name || f.field) ? f.attribute || f.name || f.field : null;
      if (fname) uniqueAttrsSet.add(fname);
    }
  }

  // Normalize final list of unique fields (exclude PK if present)
  const uniqueAttrs = Array.from(uniqueAttrsSet).filter((a) => a !== primaryKeyAttr);

  // If PK is integer type, add convertToNumber by default if not in formattingFunctions
  try {
    const pkAttrDef = primaryKeyAttr ? rawAttrs[primaryKeyAttr] : null;
    const pkTypeKey =
      pkAttrDef && pkAttrDef.type && pkAttrDef.type.key ? String(pkAttrDef.type.key).toUpperCase() : null;
    if (pkTypeKey && (pkTypeKey.includes('INT') || pkTypeKey === 'BIGINT')) {
      if (!formattingFunctions.includes(convertToNumber)) {
        formattingFunctions.push(convertToNumber);
      }
    }
  } catch (e) {
    throw new Error('Error validating value against model: ' + e.message);
  }

  const validationSchema = {
    in: location,
    customSanitizer: formattingFunctions.length
      ? {
          options: (value) => {
            return formattingFunctions.reduce((acc, fn) => {
              return typeof fn === 'function' ? fn(acc) : acc;
            }, value);
          },
        }
      : undefined,
    custom: {
      options: async (value) => {
        // empty value handled by existence/required in main schema
        // First validate against PK (if allowed)
        const Op =
          model.sequelize && model.sequelize.Sequelize ? model.sequelize.Sequelize.Op : require('sequelize').Op;

        if ((value === null || typeof value === 'undefined' || value === '') && required) {
          throw new Error(i18n.__mf('validations.required', { field: fieldName }));
        }

        // If PK is allowed, check findByPk
        if (allowPrimaryKey && primaryKeyAttr) {
          const byPk = await model.findByPk(value, { attributes: [primaryKeyAttr] });
          const existsPk = byPk !== null;

          if (existsPk) {
            if (!shouldExist) {
              // When we expect it NOT to exist but found one
              throw new Error(i18n.__mf('validations.already_exists', { field: fieldName }));
            }
            return true; // found in PK -> valid
          }
        }

        // Check unique fields (one by one) if allowed
        if (allowUniqueFields && uniqueAttrs.length > 0) {
          for (const attr of uniqueAttrs) {
            const where = { [attr]: value };

            // Exclude a value by PK if specified
            if (excludeValue !== null && primaryKeyAttr) {
              where[primaryKeyAttr] = {
                [Op.ne]: excludeValue,
              };
            }

            const found = await model.findOne({
              where,
              attributes: [primaryKeyAttr || attr],
            });

            if (found) {
              if (!shouldExist) {
                // Found but expected NOT to exist
                throw new Error(i18n.__mf('validations.already_exists', { field: fieldName }));
              }
              return true; // found in a unique field -> valid
            }
          }

          // Not found in unique fields
          if (shouldExist) {
            // we were checking for existence but it doesn't exist in PK or unique fields
            throw new Error(i18n.__mf('validations.not_exists', { field: fieldName }));
          } else {
            // we were checking for NON-existence and it doesn't exist -> valid
            return true;
          }
        }

        // If no unique fields or PK to check and existence is required -> error
        if (shouldExist) {
          throw new Error(i18n.__mf('validations.not_exists', { field: fieldName }));
        }

        return true;
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

  return validationSchema;
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  idSchema,
  validateUniqueField,
  validateMultipleIds,
  validateModelAttributes,
  validateValueAgainstModel,
};
