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
const { convertToNumber } = require('../numbers.helper');

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

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  idSchema,
  validateUniqueField,
  validateMultipleIds,
  validateModelAttributes,
};
