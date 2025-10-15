// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../../config/i18n');
const { convertToNumber } = require('../../utils/numbers.util');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
const getFieldName = (name) => {
  return typeof i18n !== 'undefined' ? i18n.__mf('fields.' + name) : `fields.${name}`;
};

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

const validateSecurityLevel = (value, fieldName, minSecurityLevel, req) => {
  if (minSecurityLevel === 0) return true;

  const allowNull = false;
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

const idSchema = (
  name,
  location = 'body',
  { required = true, formattingFunctions = [], model, minSecurityLevel = 1 }
) => {
  const fieldName = getFieldName(name);
  const validationSchema = {
    in: location,
    custom: {
      options: async (value, { req }) => {
        validateSecurityLevel(value, fieldName, minSecurityLevel, req);

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

const validateUniqueField = (
  name,
  location = 'body',
  { model, field, shouldExist = false, required = true, excludeValue = null, minSecurityLevel = 1 }
) => {
  const fieldName = getFieldName(name);

  const validationSchema = {
    in: location,
    custom: {
      options: async (value, { req }) => {
        validateSecurityLevel(value, fieldName, minSecurityLevel, req);

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

const validateMultipleIds = (
  name,
  location = 'body',
  { model, required = true, minLength = 1, maxLength = null, minSecurityLevel = 1 }
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
        validateSecurityLevel(value, fieldName, minSecurityLevel, req);

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

const validateModelAttributes = (
  name,
  location = 'body',
  { model, required = true, allowedAttributes = null, minSecurityLevel = 1 }
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
        validateSecurityLevel(value, fieldName, minSecurityLevel, req);

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
    minSecurityLevel = 1,
  } = {}
) => {
  const fieldName = getFieldName(name);

  if (!model) {
    throw new Error('validateValueAgainstModel requires a Sequelize model in options.model');
  }

  let primaryKeyAttr = null;
  if (typeof model.primaryKeyAttribute === 'string' && model.primaryKeyAttribute.length > 0) {
    primaryKeyAttr = model.primaryKeyAttribute;
  } else if (Array.isArray(model.primaryKeyAttributes) && model.primaryKeyAttributes.length > 0) {
    primaryKeyAttr = model.primaryKeyAttributes[0];
  } else {
    for (const attr of Object.keys(model.rawAttributes || {})) {
      if (model.rawAttributes[attr].primaryKey) {
        primaryKeyAttr = attr;
        break;
      }
    }
  }

  const uniqueAttrsSet = new Set();
  const rawAttrs = model.rawAttributes || {};

  for (const attrName of Object.keys(rawAttrs)) {
    const attr = rawAttrs[attrName];
    if (attr && attr.unique === true) {
      uniqueAttrsSet.add(attrName);
    }
  }

  const indexes = (model.options && model.options.indexes) || [];
  for (const idx of indexes) {
    if (idx.unique && Array.isArray(idx.fields) && idx.fields.length === 1) {
      const f = idx.fields[0];
      const fname =
        typeof f === 'string' ? f : f && (f.attribute || f.name || f.field) ? f.attribute || f.name || f.field : null;
      if (fname) uniqueAttrsSet.add(fname);
    }
  }

  const uniqueAttrs = Array.from(uniqueAttrsSet).filter((a) => a !== primaryKeyAttr);

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
      options: async (value, { req }) => {
        validateSecurityLevel(value, fieldName, minSecurityLevel, req);

        const Op =
          model.sequelize && model.sequelize.Sequelize ? model.sequelize.Sequelize.Op : require('sequelize').Op;

        if ((value === null || typeof value === 'undefined' || value === '') && required) {
          throw new Error(i18n.__mf('validations.required', { field: fieldName }));
        }

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
