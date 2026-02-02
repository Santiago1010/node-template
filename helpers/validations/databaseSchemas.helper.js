// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../../config/i18n'); // Internationalization for error messages
const { convertToNumber } = require('../../utils/numbers.util'); // Number conversion utility
const { cerror } = require('../debug.helper'); // Debugging utilities

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Retrieves internationalized field name for validation messages
 *
 * @description Gets the translated field name from i18n configuration or falls back to generic format
 * @param {string} name - Field identifier used for i18n lookup
 * @returns {string} Internationalized field name or fallback identifier
 *
 * @example
 * // Returns translated field name like "User ID" or falls back to "fields.userId"
 * const fieldName = getFieldName('userId');
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

/**
 * Parses and sanitizes input values into clean string arrays
 *
 * @description Converts various input types (array, comma-separated string) into trimmed string arrays
 * @param {any} value - Input value to parse (array, string, or other)
 * @returns {string[]} Array of trimmed, non-empty strings
 *
 * @example
 * // Returns ['apple', 'banana', 'cherry']
 * const fruits = parseToArray('apple, banana, cherry');
 *
 * @example
 * // Returns ['one', 'two']
 * const numbers = parseToArray([' one ', 'two', '']);
 *
 * @complexity Time: O(n), Space: O(n) where n is number of elements
 * @since Version 1.0.0
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
 * Generates validation schema for database ID fields with existence checking
 *
 * @description Validates that an ID exists in the specified database table, with security level and scope checks
 * @param {string} name - Field name for internationalization
 * @param {string} [location='body'] - Request location to validate ('body', 'params', 'query')
 * @param {object} options - Configuration options
 * @param {boolean} [options.required=true] - Whether the field is mandatory
 * @param {Function[]} [options.formattingFunctions=[]] - Additional value formatting functions
 * @param {object} options.model - Sequelize model for database existence check
 * @param {string} [options.requiredScope] - Required OAuth/RBAC scope for this field
 * @returns {object} Express-validator validation schema object
 *
 * @example
 * // Basic ID validation for User model
 * app.post('/user/:id', [
 *   check('id', idSchema('userId', 'params', { model: User }))
 * ]);
 *
 * @example
 * // ID validation with scope requirement
 * app.get('/admin/data', [
 *   check('id', idSchema('adminId', 'params', {
 *     model: Admin,
 *     requiredScope: 'admin.read'
 *   }))
 * ]);
 *
 * @complexity Time: O(1) + 1 database query, Space: O(1)
 * @since Version 1.0.0
 * @see {@link validateValueAgainstModel} for more complex model-based validation
 */
const idSchema = (name, location = 'body', { required = true, formattingFunctions = [], model, requiredScope }) => {
  const fieldName = getFieldName(name);
  const validationSchema = {
    in: location,
    custom: {
      options: async (value, { req }) => {
        validateScope(req, requiredScope);

        const data = await model.findByPk(value);
        return data !== null;
      },
      errorMessage: i18n.__mf('validations.not_exists', { field: fieldName }),
    },
  };

  if (required) {
    validationSchema.exists = {
      errorMessage: i18n.__mf('validations.required', { field: fieldName }),
    };

    validationSchema.notEmpty = {
      errorMessage: i18n.__mf('validations.required', { field: fieldName }),
    };
  }

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
 * Validates field uniqueness or existence constraints in database tables
 *
 * @description Checks if a field value is unique (for creation) or exists (for updates) in the database
 * @param {string} name - Field name for internationalization
 * @param {string} [location='body'] - Request location to validate
 * @param {object} options - Configuration options
 * @param {object} options.model - Sequelize model for database operations
 * @param {string} options.field - Database field name to check
 * @param {boolean} [options.shouldExist=false] - True to require existence, false to require uniqueness
 * @param {boolean} [options.required=true] - Whether the field is mandatory
 * @param {any} [options.excludeValue=null] - Value to exclude from uniqueness check (for updates)
 * @param {string} [options.requiredScope] - Required OAuth/RBAC scope for this field
 * @returns {object} Express-validator validation schema object
 *
 * @example
 * // Email uniqueness check for user registration
 * validateUniqueField('email', 'body', {
 *   model: User,
 *   field: 'email',
 *   shouldExist: false, // Must NOT exist (unique)
 *   requiredScope: 'user.write'
 * })
 *
 * @example
 * // Username existence check for password reset (excluding current user)
 * validateUniqueField('username', 'body', {
 *   model: User,
 *   field: 'username',
 *   shouldExist: true, // Must exist
 *   excludeValue: currentUserId,
 *   requiredScope: 'user.update'
 * })
 *
 * @complexity Time: O(1) + 1 database query, Space: O(1)
 * @since Version 1.0.0
 */
const validateUniqueField = (
  name,
  location = 'body',
  { model, field, shouldExist = false, required = true, excludeValue = null, requiredScope }
) => {
  const fieldName = getFieldName(name);

  const validationSchema = {
    in: location,
    custom: {
      options: async (value, { req }) => {
        validateScope(req, requiredScope);

        const whereClause = { [field]: value };

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
 * Validates multiple IDs for existence in database with array constraints
 *
 * @description Validates an array of IDs checking existence in database and array size constraints
 * @param {string} name - Field name for internationalization
 * @param {string} [location='body'] - Request location to validate
 * @param {object} options - Configuration options
 * @param {object} options.model - Sequelize model for existence checks
 * @param {boolean} [options.required=true] - Whether the field is mandatory
 * @param {number} [options.minLength=1] - Minimum number of IDs required
 * @param {number} [options.maxLength=null] - Maximum number of IDs allowed
 * @param {string} [options.requiredScope] - Required OAuth/RBAC scope for this field
 * @returns {object} Express-validator validation schema object
 *
 * @example
 * // Validate category IDs for product creation (2-5 categories required)
 * validateMultipleIds('categoryIds', 'body', {
 *   model: Category,
 *   minLength: 2,
 *   maxLength: 5,
 *   requiredScope: 'product.create'
 * })
 *
 * @example
 * // Validate optional tag IDs (0-10 tags allowed) with admin scope
 * validateMultipleIds('tagIds', 'body', {
 *   model: Tag,
 *   required: false,
 *   minLength: 0,
 *   maxLength: 10,
 *   requiredScope: 'admin.tags'
 * })
 *
 * @complexity Time: O(n) + 1 database query, Space: O(n) where n is number of IDs
 * @since Version 1.0.0
 */
const validateMultipleIds = (
  name,
  location = 'body',
  { model, required = true, minLength = 1, maxLength = null, requiredScope }
) => {
  const fieldName = getFieldName(name);

  const validationSchema = {
    in: location,
    customSanitizer: {
      options: (value) => {
        const idsArray = parseToArray(value);
        return idsArray.map((id) => convertToNumber(id)).filter((id) => !isNaN(id));
      },
    },
    custom: {
      options: async (value, { req }) => {
        validateScope(req, requiredScope);

        const idsArray = Array.isArray(value) ? value : parseToArray(value);

        if (idsArray.length < minLength) {
          throw new Error(
            i18n.__mf('validations.min_length', {
              field: fieldName,
              min: minLength,
            })
          );
        }

        if (maxLength !== null && idsArray.length > maxLength) {
          throw new Error(
            i18n.__mf('validations.max_length', {
              field: fieldName,
              max: maxLength,
            })
          );
        }

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
 * Validates model attribute names for safe database operations
 *
 * @description Ensures only valid model attributes are used in operations like sorting, filtering, or selecting
 * @param {string} name - Field name for internationalization
 * @param {string} [location='body'] - Request location to validate
 * @param {object} options - Configuration options
 * @param {object} options.model - Sequelize model to validate against
 * @param {boolean} [options.required=true] - Whether attributes are mandatory
 * @param {string[]} [options.allowedAttributes=null] - Custom allowed attributes (defaults to all model attributes)
 * @param {string} [options.requiredScope] - Required OAuth/RBAC scope for this field
 * @returns {object} Express-validator validation schema object
 *
 * @example
 * // Validate sort fields against User model attributes
 * validateModelAttributes('sortBy', 'query', {
 *   model: User,
 *   allowedAttributes: ['name', 'email', 'createdAt'],
 *   requiredScope: 'user.read'
 * })
 *
 * @example
 * // Validate select fields for API response shaping with admin scope
 * validateModelAttributes('fields', 'query', {
 *   model: Product,
 *   required: false,
 *   requiredScope: 'admin.products'
 * })
 *
 * @complexity Time: O(n) where n is number of attributes, Space: O(n)
 * @since Version 1.0.0
 */
const validateModelAttributes = (
  name,
  location = 'body',
  { model, required = true, allowedAttributes = null, requiredScope }
) => {
  const fieldName = getFieldName(name);

  const validationSchema = {
    in: location,
    customSanitizer: {
      options: (value) => {
        return parseToArray(value);
      },
    },
    custom: {
      options: (value, { req }) => {
        validateScope(req, requiredScope);

        const attributesArray = Array.isArray(value) ? value : parseToArray(value);

        if (attributesArray.length === 0) {
          throw new Error(i18n.__mf('validations.required', { field: fieldName }));
        }

        const modelAttributes = Object.keys(model.rawAttributes);
        const validAttributes = allowedAttributes || modelAttributes;
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
 * Comprehensive model-based value validation with flexible existence checking
 *
 * @description Advanced validation that checks value existence against primary key and unique fields
 * @param {string} name - Field name for internationalization
 * @param {string} [location='body'] - Request location to validate
 * @param {object} options - Configuration options
 * @param {object} options.model - Sequelize model for validation
 * @param {boolean} [options.required=true] - Whether the field is mandatory
 * @param {Function[]} [options.formattingFunctions=[]] - Value formatting functions
 * @param {boolean} [options.shouldExist=true] - True to require existence, false to require non-existence
 * @param {any} [options.excludeValue=null] - Value to exclude from checks (for updates)
 * @param {boolean} [options.allowPrimaryKey=true] - Whether to check against primary key
 * @param {boolean} [options.allowUniqueFields=true] - Whether to check against unique fields
 * @param {string} [options.requiredScope] - Required OAuth/RBAC scope for this field
 * @returns {object} Express-validator validation schema object
 * @throws {Error} When model configuration is invalid or missing
 *
 * @example
 * // Validate username exists for password reset
 * validateValueAgainstModel('username', 'body', {
 *   model: User,
 *   shouldExist: true,
 *   allowPrimaryKey: false,
 *   allowUniqueFields: true,
 *   requiredScope: 'user.update'
 * })
 *
 * @example
 * // Validate email doesn't exist for new registration (with formatting and scope)
 * validateValueAgainstModel('email', 'body', {
 *   model: User,
 *   shouldExist: false,
 *   formattingFunctions: [emailFormatter, trimFormatter],
 *   requiredScope: 'user.register'
 * })
 *
 * @complexity Time: O(1) + 1-3 database queries, Space: O(1)
 * @since Version 1.0.0
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
    requiredScope,
  } = {}
) => {
  const fieldName = getFieldName(name);

  if (!model) {
    throw new Error('validateValueAgainstModel requires a Sequelize model in options.model');
  }

  // Extract primary key attribute with fallback strategies
  let primaryKeyAttr = null;
  if (typeof model.primaryKeyAttribute === 'string' && model.primaryKeyAttribute.length > 0) {
    primaryKeyAttr = model.primaryKeyAttribute;
  } else if (Array.isArray(model.primaryKeyAttributes) && model.primaryKeyAttributes.length > 0) {
    primaryKeyAttr = model.primaryKeyAttributes[0];
  } else {
    // Fallback: manually search for primary key in attributes
    for (const attr of Object.keys(model.rawAttributes || {})) {
      if (model.rawAttributes[attr].primaryKey) {
        primaryKeyAttr = attr;
        break;
      }
    }
  }

  // Extract unique attributes from model definition
  const uniqueAttrsSet = new Set();
  const rawAttrs = model.rawAttributes || {};

  // Find unique attributes from field definitions
  for (const attrName of Object.keys(rawAttrs)) {
    const attr = rawAttrs[attrName];
    if (attr && attr.unique === true) {
      uniqueAttrsSet.add(attrName);
    }
  }

  // Find unique attributes from model indexes
  const indexes = (model.options && model.options.indexes) || [];
  for (const idx of indexes) {
    if (idx.unique && Array.isArray(idx.fields) && idx.fields.length === 1) {
      const f = idx.fields[0];
      const fname =
        typeof f === 'string' ? f : f && (f.attribute || f.name || f.field) ? f.attribute || f.name || f.field : null;
      if (fname) uniqueAttrsSet.add(fname);
    }
  }

  // Filter out primary key from unique attributes
  const uniqueAttrs = Array.from(uniqueAttrsSet).filter((a) => a !== primaryKeyAttr);

  // Auto-detect numeric primary keys for automatic number conversion
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
    cerror('helpers/validations/database.schemas.js.validateValueAgainstModel', e);
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
      options: async (value, { req }) => {
        validateScope(req, requiredScope);

        const Op =
          model.sequelize && model.sequelize.Sequelize ? model.sequelize.Sequelize.Op : require('sequelize').Op;

        if ((value === null || typeof value === 'undefined' || value === '') && required) {
          throw new Error(i18n.__mf('validations.required', { field: fieldName }));
        }

        // Check against primary key if enabled
        if (allowPrimaryKey && primaryKeyAttr) {
          const byPk = await model.findByPk(value, { attributes: [primaryKeyAttr] });
          const existsPk = byPk !== null;

          if (existsPk) {
            if (!shouldExist) {
              throw new Error(i18n.__mf('validations.already_exists', { field: fieldName }));
            }
            return true;
          }
        }

        // Check against unique fields if enabled
        if (allowUniqueFields && uniqueAttrs.length > 0) {
          for (const attr of uniqueAttrs) {
            const where = { [attr]: value };

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
                throw new Error(i18n.__mf('validations.already_exists', { field: fieldName }));
              }
              return true;
            }
          }

          if (shouldExist) {
            throw new Error(i18n.__mf('validations.not_exists', { field: fieldName }));
          } else {
            return true;
          }
        }

        if (shouldExist) {
          throw new Error(i18n.__mf('validations.not_exists', { field: fieldName }));
        }

        return true;
      },
    },
  };

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
