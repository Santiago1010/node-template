const boom = require('@hapi/boom');

const i18n = require('../../config/i18n');
const { logger } = require('../../config/tools/logger.config');
const { get, set } = require('../../helpers/cache.helper');

class BOLAGuard {
  static async checkResourceOwnership(req, _, next) {
    try {
      const resourceType = req.resourceType;
      const resourceId = req.params.id || req.params[resourceType + 'Id'];
      const accountId = req.user?.accountId;
      const userScopes = req.user?.scopes || [];

      if (!accountId) {
        throw boom.unauthorized(i18n.__('error.authentication_required'));
      }

      if (!resourceType || !resourceId) {
        return next();
      }

      const cacheKey = `bola:${resourceType}:${resourceId}:${accountId}`;
      const cached = await get(cacheKey);

      if (cached !== null) {
        if (!cached) {
          logger.warn('BOLA attempt detected (cached)', {
            accountId,
            resourceType,
            resourceId,
            ip: req.ip,
          });
          throw boom.forbidden(i18n.__('error.access_denied'));
        }
        return next();
      }

      const hasOwnership = await BOLAGuard.verifyOwnership(resourceType, resourceId, accountId, userScopes, req);

      await set(cacheKey, hasOwnership, 300);

      if (!hasOwnership) {
        logger.warn('BOLA attempt detected', {
          accountId,
          resourceType,
          resourceId,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        throw boom.forbidden(i18n.__('error.access_denied'));
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  static async verifyOwnership(resourceType, resourceId, accountId, scopes, req) {
    const models = require('../../models');

    if (scopes.includes('admin:full_access') || scopes.includes(`${resourceType}:read:all`)) {
      return true;
    }

    const modelMap = {
      user: 'usrUsers',
      account: 'usrAccounts',
      device: 'usrDevices',
      access: 'usrAccesses',
    };

    const modelName = modelMap[resourceType];
    if (!modelName || !models[modelName]) {
      logger.error('Invalid resource type for BOLA check', { resourceType });
      return false;
    }

    try {
      const resource = await models[modelName].findByPk(resourceId, {
        attributes: ['id', 'userId', 'accountId', 'employeeId'],
        paranoid: true,
      });

      if (!resource) {
        return false;
      }

      const ownershipFields = ['userId', 'accountId', 'employeeId'];
      for (const field of ownershipFields) {
        if (resource[field] && resource[field] === accountId) {
          return true;
        }
      }

      if (req.method === 'GET' && scopes.includes(`${resourceType}:read:own`)) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error verifying resource ownership', {
        error: error.message,
        resourceType,
        resourceId,
        accountId,
      });
      return false;
    }
  }

  static requireResourceType(resourceType) {
    return (req, _, next) => {
      req.resourceType = resourceType;
      next();
    };
  }

  static checkPathParameter(paramName, resourceType) {
    return async (req, res, next) => {
      try {
        const resourceId = req.params[paramName];
        const accountId = req.user?.accountId;

        if (!accountId || !resourceId) {
          throw boom.unauthorized(i18n.__('error.authentication_required'));
        }

        req.resourceType = resourceType;
        await BOLAGuard.checkResourceOwnership(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  static preventIDOR(allowedFields = []) {
    return async (req, _, next) => {
      try {
        const params = { ...req.params, ...req.query };
        const suspiciousParams = ['userId', 'accountId', 'employeeId', 'id'];

        for (const param of suspiciousParams) {
          if (params[param] && !allowedFields.includes(param)) {
            const accountId = req.user?.accountId;
            const providedId = params[param];

            if (providedId !== accountId && providedId !== accountId.toString()) {
              logger.warn('IDOR attempt detected', {
                accountId,
                attemptedId: providedId,
                param,
                ip: req.ip,
                path: req.path,
              });
              throw boom.forbidden(i18n.__('error.access_denied'));
            }
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static scopeGuard(requiredScopes = []) {
    return (req, _, next) => {
      try {
        const userScopes = req.user?.scopes || [];
        const hasScope = requiredScopes.some(
          (scope) => userScopes.includes(scope) || userScopes.includes('admin:full_access')
        );

        if (!hasScope) {
          logger.warn('Insufficient scopes', {
            accountId: req.user?.accountId,
            requiredScopes,
            userScopes,
            path: req.path,
          });
          throw boom.forbidden(i18n.__('error.insufficient_permissions'));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = BOLAGuard;
