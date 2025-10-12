const boom = require('@hapi/boom');

const i18n = require('../../config/i18n');
const { logger } = require('../../config/tools/logger.config');

const PROTECTED_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'password',
  'rolId',
  'securityLevel',
  'isAdmin',
  'isSuperAdmin',
  'permissions',
  'scopes',
  'verified',
  'emailConfirmedAt',
  'mobileNumberConfirmedAt',
];

const ROLE_PROTECTED_FIELDS = {
  user: ['rolId', 'securityLevelId', 'permissions', 'scopes', 'isAdmin'],
  admin: ['isSuperAdmin', 'systemRole'],
  system: [],
};

class MassAssignmentGuard {
  static filterAllowedFields(allowedFields = [], options = {}) {
    const { blockProtectedFields = true, checkUserRole = true, strictMode = false } = options;

    return (req, _, next) => {
      try {
        if (!req.body || typeof req.body !== 'object') {
          return next();
        }

        const userRole = req.user?.role?.name || 'user';
        const roleProtectedFields = ROLE_PROTECTED_FIELDS[userRole] || ROLE_PROTECTED_FIELDS.user;

        const bodyKeys = Object.keys(req.body);
        const blockedFields = [];
        const filteredBody = {};

        for (const key of bodyKeys) {
          let isAllowed = true;

          if (strictMode && !allowedFields.includes(key)) {
            blockedFields.push(key);
            isAllowed = false;
          }

          if (blockProtectedFields && PROTECTED_FIELDS.includes(key)) {
            blockedFields.push(key);
            isAllowed = false;
          }

          if (checkUserRole && roleProtectedFields.includes(key)) {
            blockedFields.push(key);
            isAllowed = false;
          }

          if (!strictMode && allowedFields.length > 0 && !allowedFields.includes(key)) {
            blockedFields.push(key);
            isAllowed = false;
          }

          if (isAllowed) {
            filteredBody[key] = req.body[key];
          }
        }

        if (blockedFields.length > 0) {
          logger.warn('Mass assignment attempt detected', {
            accountId: req.user?.accountId,
            blockedFields,
            ip: req.ip,
            path: req.path,
          });

          if (strictMode) {
            throw boom.badRequest(i18n.__('error.invalid_fields'), {
              blockedFields,
              allowedFields,
            });
          }
        }

        req.body = filteredBody;
        req.blockedFields = blockedFields;

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static protectFields(protectedFields = []) {
    return (req, _, next) => {
      try {
        if (!req.body || typeof req.body !== 'object') {
          return next();
        }

        const allProtectedFields = [...PROTECTED_FIELDS, ...protectedFields];
        const attemptedFields = [];

        for (const field of allProtectedFields) {
          if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            attemptedFields.push(field);
            delete req.body[field];
          }
        }

        if (attemptedFields.length > 0) {
          logger.warn('Protected fields modification attempted', {
            accountId: req.user?.accountId,
            attemptedFields,
            ip: req.ip,
            path: req.path,
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static enforceUpdateRules(model, options = {}) {
    const { allowPartialUpdate = true, requireOwnership = true, allowedFields = [] } = options;

    return async (req, _, next) => {
      try {
        const resourceId = req.params.id;
        const accountId = req.user?.accountId;

        if (!resourceId) {
          throw boom.badRequest(i18n.__('error.missing_resource_id'));
        }

        const models = require('../../models');
        const Model = models[model];

        if (!Model) {
          throw boom.internal(i18n.__('error.invalid_model'));
        }

        const resource = await Model.findByPk(resourceId);

        if (!resource) {
          throw boom.notFound(i18n.__('error.resource_not_found'));
        }

        if (requireOwnership) {
          const ownershipFields = ['userId', 'accountId', 'employeeId', 'createdBy'];
          let hasOwnership = false;

          for (const field of ownershipFields) {
            if (resource[field] && resource[field] === accountId) {
              hasOwnership = true;
              break;
            }
          }

          if (!hasOwnership && !req.user?.scopes?.includes('admin:full_access')) {
            throw boom.forbidden(i18n.__('error.access_denied'));
          }
        }

        if (allowedFields.length > 0) {
          const filteredBody = {};
          for (const key of Object.keys(req.body)) {
            if (allowedFields.includes(key)) {
              filteredBody[key] = req.body[key];
            }
          }
          req.body = filteredBody;
        }

        if (!allowPartialUpdate && allowedFields.length > 0) {
          const missingFields = allowedFields.filter((field) => !Object.prototype.hasOwnProperty.call(req.body, field));
          if (missingFields.length > 0) {
            throw boom.badRequest(i18n.__('error.missing_required_fields'), { missingFields });
          }
        }

        req.resource = resource;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static preventNestedMassAssignment(maxDepth = 3) {
    return (req, _, next) => {
      try {
        if (!req.body || typeof req.body !== 'object') {
          return next();
        }

        const checkDepth = (obj, currentDepth = 0) => {
          if (currentDepth >= maxDepth) {
            throw boom.badRequest(i18n.__('error.nested_object_too_deep'));
          }

          if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
              if (PROTECTED_FIELDS.includes(key)) {
                logger.warn('Protected field in nested object', {
                  field: key,
                  depth: currentDepth,
                  ip: req.ip,
                });
                delete obj[key];
              } else if (typeof obj[key] === 'object') {
                checkDepth(obj[key], currentDepth + 1);
              }
            }
          }
        };

        checkDepth(req.body);
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static validateUpdateFields(schema) {
    return (req, _, next) => {
      try {
        if (!req.body || typeof req.body !== 'object') {
          return next();
        }

        const bodyKeys = Object.keys(req.body);
        const schemaKeys = Object.keys(schema);
        const invalidKeys = [];

        for (const key of bodyKeys) {
          if (!schemaKeys.includes(key)) {
            invalidKeys.push(key);
          } else if (schema[key].readOnly) {
            invalidKeys.push(key);
            delete req.body[key];
          } else if (schema[key].adminOnly && !req.user?.scopes?.includes('admin:full_access')) {
            invalidKeys.push(key);
            delete req.body[key];
          }
        }

        if (invalidKeys.length > 0) {
          logger.warn('Invalid or protected fields in update', {
            accountId: req.user?.accountId,
            invalidKeys,
            ip: req.ip,
            path: req.path,
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static trackFieldChanges() {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function (body) {
        if (req.resource && req.body) {
          const changes = {};
          for (const key in req.body) {
            if (req.resource[key] !== req.body[key]) {
              changes[key] = {
                old: req.resource[key],
                new: req.body[key],
              };
            }
          }

          if (Object.keys(changes).length > 0) {
            logger.info('Resource updated', {
              accountId: req.user?.accountId,
              resourceId: req.resource.id,
              changes,
              ip: req.ip,
            });
          }
        }

        return originalJson(body);
      };

      next();
    };
  }
}

module.exports = MassAssignmentGuard;
