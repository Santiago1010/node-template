const boom = require('@hapi/boom');
const sanitizeHtml = require('sanitize-html');

const i18n = require('../../config/i18n');
const { logger } = require('../../config/tools/logger.config');

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|\;|\*|\/\*|\*\/|xp_|sp_)/gi,
  /('|('')|;|--|\/\*|\*\/|xp_|sp_)/gi,
];

const NOSQL_INJECTION_PATTERNS = [/\$where/gi, /\$ne/gi, /\$gt/gi, /\$lt/gi, /\$regex/gi, /\$or/gi, /\$and/gi];

const COMMAND_INJECTION_PATTERNS = [/[;&|`$(){}[\]<>]/g, /\.\.\//g, /(curl|wget|nc|netcat|bash|sh|powershell|cmd)/gi];

const PATH_TRAVERSAL_PATTERNS = [/\.\.[\/\\]/g, /[\/\\]\.\./g, /%2e%2e/gi, /%252e/gi];

const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /on\w+\s*=/gi,
  /javascript:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
];

class Sanitizer {
  static sanitizeRequest(options = {}) {
    const {
      sanitizeBody = true,
      sanitizeQuery = true,
      sanitizeParams = true,
      allowHtml = false,
      strictMode = false,
    } = options;

    return (req, _, next) => {
      try {
        if (sanitizeBody && req.body) {
          req.body = Sanitizer.sanitizeObject(req.body, { allowHtml, strictMode });
        }

        if (sanitizeQuery && req.query) {
          req.query = Sanitizer.sanitizeObject(req.query, { allowHtml: false, strictMode });
        }

        if (sanitizeParams && req.params) {
          req.params = Sanitizer.sanitizeObject(req.params, { allowHtml: false, strictMode });
        }

        next();
      } catch (error) {
        logger.error('Sanitization error', {
          error: error.message,
          path: req.path,
          ip: req.ip,
        });
        next(boom.badRequest(i18n.__('error.invalid_input')));
      }
    };
  }

  static sanitizeObject(obj, options = {}) {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => Sanitizer.sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = Sanitizer.sanitizeString(key, { ...options, allowHtml: false });
        sanitized[sanitizedKey] = Sanitizer.sanitizeObject(value, options);
      }
      return sanitized;
    }

    if (typeof obj === 'string') {
      return Sanitizer.sanitizeString(obj, options);
    }

    return obj;
  }

  static sanitizeString(str, options = {}) {
    const { allowHtml = false, strictMode = false } = options;

    if (typeof str !== 'string') return str;

    let sanitized = str.trim();

    if (strictMode) {
      if (SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(sanitized))) {
        throw new Error('Potential SQL injection detected');
      }

      if (NOSQL_INJECTION_PATTERNS.some((pattern) => pattern.test(sanitized))) {
        throw new Error('Potential NoSQL injection detected');
      }

      if (COMMAND_INJECTION_PATTERNS.some((pattern) => pattern.test(sanitized))) {
        throw new Error('Potential command injection detected');
      }
    }

    sanitized = sanitized.replace(PATH_TRAVERSAL_PATTERNS[0], '');
    sanitized = sanitized.replace(PATH_TRAVERSAL_PATTERNS[1], '');

    if (allowHtml) {
      sanitized = sanitizeHtml(sanitized, {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
        allowedAttributes: {
          a: ['href', 'title'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
      });
    } else {
      if (XSS_PATTERNS.some((pattern) => pattern.test(sanitized))) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      }
    }

    return sanitized;
  }

  static preventSQLInjection() {
    return (req, _, next) => {
      try {
        const checkInjection = (obj) => {
          if (typeof obj === 'string') {
            for (const pattern of SQL_INJECTION_PATTERNS) {
              if (pattern.test(obj)) {
                logger.warn('SQL injection attempt detected', {
                  input: obj.substring(0, 100),
                  ip: req.ip,
                  path: req.path,
                });
                throw boom.badRequest(i18n.__('error.invalid_input'));
              }
            }
          } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(checkInjection);
          }
        };

        checkInjection(req.body);
        checkInjection(req.query);
        checkInjection(req.params);

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static preventNoSQLInjection() {
    return (req, _, next) => {
      try {
        const sanitizeNoSQL = (obj) => {
          if (obj && typeof obj === 'object') {
            for (const key in obj) {
              if (key.startsWith('$')) {
                logger.warn('NoSQL injection attempt detected', {
                  key,
                  ip: req.ip,
                  path: req.path,
                });
                throw boom.badRequest(i18n.__('error.invalid_input'));
              }

              if (typeof obj[key] === 'object') {
                sanitizeNoSQL(obj[key]);
              }
            }
          }
        };

        sanitizeNoSQL(req.body);
        sanitizeNoSQL(req.query);

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static preventPathTraversal() {
    return (req, _, next) => {
      try {
        const checkPath = (value) => {
          if (typeof value === 'string') {
            for (const pattern of PATH_TRAVERSAL_PATTERNS) {
              if (pattern.test(value)) {
                logger.warn('Path traversal attempt detected', {
                  input: value,
                  ip: req.ip,
                  path: req.path,
                });
                throw boom.badRequest(i18n.__('error.invalid_input'));
              }
            }
          }
        };

        Object.values(req.params || {}).forEach(checkPath);
        Object.values(req.query || {}).forEach(checkPath);

        if (req.body && typeof req.body === 'object') {
          Object.values(req.body).forEach(checkPath);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static strictInputValidation(allowedFields = []) {
    return (req, _, next) => {
      try {
        const bodyKeys = Object.keys(req.body || {});
        const invalidKeys = bodyKeys.filter((key) => !allowedFields.includes(key));

        if (invalidKeys.length > 0) {
          logger.warn('Unexpected fields in request', {
            invalidKeys,
            ip: req.ip,
            path: req.path,
          });
          throw boom.badRequest(i18n.__('error.invalid_fields'), { invalidKeys });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = Sanitizer;
