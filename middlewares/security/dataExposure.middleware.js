// middlewares/security/dataExposure.middleware.js

const { logger } = require('../../config/tools/logger.config');

const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'salt',
  'securityToken',
  'resetToken',
  'verificationToken',
  'apiKey',
  'apiSecret',
  'privateKey',
  'refreshToken',
  'accessToken',
  'sessionId',
  'sessionToken',
  'ssn',
  'taxId',
  'creditCard',
  'cvv',
  'pin',
  'bankAccount',
];

const PII_FIELDS = [
  'email',
  'mobileNumber',
  'phoneNumber',
  'address',
  'fullAddress',
  'zipCode',
  'postalCode',
  'dateOfBirth',
  'birthDate',
  'identificationNumber',
  'passport',
  'driverLicense',
];

const INTERNAL_FIELDS = [
  'deletedAt',
  'internalCode',
  'internalId',
  'systemId',
  'securityLevel',
  'securityLevelId',
  'rolId',
  'employeeId',
  'createdBy',
  'updatedBy',
  'deletedBy',
];

class DataExposureGuard {
  static filterSensitiveData(options = {}) {
    const {
      removeSensitive = true,
      removePII = false,
      removeInternal = false,
      customFields = [],
      allowedRoles = [],
      maskInsteadOfRemove = false,
    } = options;

    return (req, res, next) => {
      const originalJson = res.json.bind(res);
      const userRole = req.user?.role?.name || 'user';

      res.json = function (data) {
        if (data && typeof data === 'object') {
          const isAllowedRole = allowedRoles.length === 0 || allowedRoles.includes(userRole);

          if (!isAllowedRole) {
            let fieldsToRemove = [];

            if (removeSensitive) fieldsToRemove.push(...SENSITIVE_FIELDS);
            if (removePII) fieldsToRemove.push(...PII_FIELDS);
            if (removeInternal) fieldsToRemove.push(...INTERNAL_FIELDS);
            fieldsToRemove.push(...customFields);

            data = DataExposureGuard.filterObject(data, fieldsToRemove, maskInsteadOfRemove);
          }
        }

        return originalJson(data);
      };

      next();
    };
  }

  static filterObject(obj, fieldsToRemove, mask = false) {
    if (Array.isArray(obj)) {
      return obj.map((item) => DataExposureGuard.filterObject(item, fieldsToRemove, mask));
    }

    if (obj && typeof obj === 'object') {
      const filtered = {};

      for (const [key, value] of Object.entries(obj)) {
        if (fieldsToRemove.includes(key)) {
          if (mask) {
            filtered[key] = DataExposureGuard.maskValue(value);
          }
        } else if (value && typeof value === 'object') {
          filtered[key] = DataExposureGuard.filterObject(value, fieldsToRemove, mask);
        } else {
          filtered[key] = value;
        }
      }

      return filtered;
    }

    return obj;
  }

  static maskValue(value) {
    if (typeof value === 'string') {
      if (value.includes('@')) {
        const [local, domain] = value.split('@');
        return `${local.substring(0, 2)}***@${domain}`;
      }
      if (value.length > 4) {
        return `${value.substring(0, 2)}${'*'.repeat(value.length - 4)}${value.substring(value.length - 2)}`;
      }
      return '***';
    }
    return '***';
  }

  static selectFields(allowedFields = []) {
    return (_, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        if (data && typeof data === 'object') {
          data = DataExposureGuard.selectFromObject(data, allowedFields);
        }

        return originalJson(data);
      };

      next();
    };
  }

  static selectFromObject(obj, allowedFields) {
    if (Array.isArray(obj)) {
      return obj.map((item) => DataExposureGuard.selectFromObject(item, allowedFields));
    }

    if (obj && typeof obj === 'object') {
      const selected = {};

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(obj, field)) {
          selected[field] = obj[field];
        }
      }

      return selected;
    }

    return obj;
  }

  static preventOverFetching(maxRecords = 100) {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        if (Array.isArray(data) && data.length > maxRecords) {
          logger.warn('Over-fetching detected', {
            recordCount: data.length,
            maxRecords,
            path: req.path,
            accountId: req.user?.accountId,
          });

          data = data.slice(0, maxRecords);
        }

        return originalJson(data);
      };

      next();
    };
  }

  static contextualResponse(fieldsByRole = {}) {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);
      const userRole = req.user?.role?.name || 'user';

      res.json = function (data) {
        const allowedFields = fieldsByRole[userRole] || fieldsByRole['default'] || [];

        if (allowedFields.length > 0 && data && typeof data === 'object') {
          data = DataExposureGuard.selectFromObject(data, allowedFields);
        }

        return originalJson(data);
      };

      next();
    };
  }

  static maskPII(fields = PII_FIELDS) {
    return (_, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        if (data && typeof data === 'object') {
          data = DataExposureGuard.maskPIIInObject(data, fields);
        }

        return originalJson(data);
      };

      next();
    };
  }

  static maskPIIInObject(obj, fields) {
    if (Array.isArray(obj)) {
      return obj.map((item) => DataExposureGuard.maskPIIInObject(item, fields));
    }

    if (obj && typeof obj === 'object') {
      const masked = {};

      for (const [key, value] of Object.entries(obj)) {
        if (fields.includes(key) && typeof value === 'string') {
          masked[key] = DataExposureGuard.maskValue(value);
        } else if (value && typeof value === 'object') {
          masked[key] = DataExposureGuard.maskPIIInObject(value, fields);
        } else {
          masked[key] = value;
        }
      }

      return masked;
    }

    return obj;
  }

  static preventStackTraceLeakage() {
    return (err, _, __, next) => {
      if (err && err.stack && process.env.NODE_ENV === 'production') {
        delete err.stack;
      }

      next(err);
    };
  }

  static limitResponseSize(maxSizeKB = 1024) {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function (data) {
        const jsonString = JSON.stringify(data);
        const sizeKB = Buffer.byteLength(jsonString, 'utf8') / 1024;

        if (sizeKB > maxSizeKB) {
          logger.warn('Response size limit exceeded', {
            sizeKB,
            maxSizeKB,
            path: req.path,
            accountId: req.user?.accountId,
          });

          return originalJson({
            error: 'Response too large',
            message: 'The requested data exceeds the maximum response size',
            maxSizeKB,
          });
        }

        return originalJson(data);
      };

      next();
    };
  }
}

module.exports = DataExposureGuard;
