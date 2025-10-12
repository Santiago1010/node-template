// middlewares/security/csrf.middleware.js

const crypto = require('crypto');
const boom = require('@hapi/boom');
const i18n = require('../../config/i18n');
const { logger } = require('../../config/tools/logger.config');
const { set, get, del } = require('../../helpers/cache.helper');
const { isDevelopmentMode } = require('../../helpers/debug.helper');
const { SECURITY_CONFIG } = require('../../utils/constants.util');

class CSRFProtection {
  static generateToken(req, res, next) {
    try {
      const token = crypto.randomBytes(SECURITY_CONFIG.CSRF.TOKEN_LENGTH).toString('hex');
      const accountId = req.user?.accountId || req.sessionID || req.ip;
      const tokenKey = `csrf:${accountId}:${token}`;

      set(
        tokenKey,
        {
          accountId,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          createdAt: Date.now(),
        },
        SECURITY_CONFIG.CSRF.TOKEN_LENGTH
      );

      res.cookie(SECURITY_CONFIG.CSRF.COOKIE_NAME, token, {
        httpOnly: true,
        secure: !isDevelopmentMode(true),
        sameSite: 'strict',
        maxAge: SECURITY_CONFIG.CSRF.TOKEN_LENGTH * 1000,
      });

      req.csrfToken = token;
      res.locals.csrfToken = token;

      next();
    } catch (error) {
      logger.error('CSRF token generation failed', {
        error: error.message,
        ip: req.ip,
      });
      next(error);
    }
  }

  static validateToken(options = {}) {
    const { skipMethods = ['GET', 'HEAD', 'OPTIONS'], skipPaths = [], strictMode = true } = options;

    return async (req, _, next) => {
      try {
        if (isDevelopmentMode() && !strictMode) {
          return next();
        }

        if (skipMethods.includes(req.method)) {
          return next();
        }

        if (skipPaths.some((path) => req.path.startsWith(path))) {
          return next();
        }

        const tokenFromHeader = req.get(SECURITY_CONFIG.CSRF.HEADER_NAME);
        const tokenFromBody = req.body?._csrf;
        const tokenFromQuery = req.query?._csrf;
        const token = tokenFromHeader || tokenFromBody || tokenFromQuery;

        if (!token) {
          logger.warn('CSRF token missing', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            accountId: req.user?.accountId,
          });
          throw boom.forbidden(i18n.__('error.csrf_token_missing'));
        }

        const accountId = req.user?.accountId || req.sessionID || req.ip;
        const tokenKey = `csrf:${accountId}:${token}`;
        const tokenData = await get(tokenKey);

        if (!tokenData) {
          logger.warn('CSRF token invalid or expired', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            accountId: req.user?.accountId,
          });
          throw boom.forbidden(i18n.__('error.csrf_token_invalid'));
        }

        if (strictMode && tokenData.ip !== req.ip) {
          logger.warn('CSRF token IP mismatch', {
            tokenIp: tokenData.ip,
            requestIp: req.ip,
            accountId,
          });
          throw boom.forbidden(i18n.__('error.csrf_token_invalid'));
        }

        await del(tokenKey);

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static doubleSubmitCookie() {
    return (req, _, next) => {
      try {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return next();
        }

        const cookieToken = req.cookies[SECURITY_CONFIG.CSRF.COOKIE_NAME];
        const headerToken = req.get(SECURITY_CONFIG.CSRF.HEADER_NAME);

        if (!cookieToken || !headerToken) {
          logger.warn('CSRF double-submit cookie check failed - missing tokens', {
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken,
            path: req.path,
            ip: req.ip,
          });
          throw boom.forbidden(i18n.__('error.csrf_token_missing'));
        }

        if (cookieToken !== headerToken) {
          logger.warn('CSRF double-submit cookie check failed - mismatch', {
            path: req.path,
            ip: req.ip,
            accountId: req.user?.accountId,
          });
          throw boom.forbidden(i18n.__('error.csrf_token_invalid'));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static originCheck(options = {}) {
    const { allowedOrigins = [], strictMode = true } = options;

    return (req, _, next) => {
      try {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          return next();
        }

        const origin = req.get('origin');
        const referer = req.get('referer');

        if (!origin && !referer) {
          if (strictMode) {
            logger.warn('CSRF origin check failed - no origin/referer', {
              path: req.path,
              ip: req.ip,
            });
            throw boom.forbidden(i18n.__('error.invalid_origin'));
          }
          return next();
        }

        const requestOrigin = origin || new URL(referer).origin;
        const allowedOriginsList = [process.env.PRIMARY_DOMAIN, process.env.SECONDARY_DOMAIN, ...allowedOrigins].filter(
          Boolean
        );

        if (!allowedOriginsList.some((allowed) => requestOrigin.includes(allowed))) {
          logger.warn('CSRF origin check failed - unauthorized origin', {
            origin: requestOrigin,
            path: req.path,
            ip: req.ip,
          });
          throw boom.forbidden(i18n.__('error.invalid_origin'));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static rotateToken() {
    return async (req, res, next) => {
      try {
        const oldToken = req.cookies[SECURITY_CONFIG.CSRF.COOKIE_NAME];

        if (oldToken) {
          const accountId = req.user?.accountId || req.sessionID || req.ip;
          const oldTokenKey = `csrf:${accountId}:${oldToken}`;
          await del(oldTokenKey);
        }

        CSRFProtection.generateToken(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  static sameSiteEnforcement() {
    return (_, res, next) => {
      const cookieHeader = res.getHeader('Set-Cookie');

      if (cookieHeader) {
        const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
        const updatedCookies = cookies.map((cookie) => {
          if (!cookie.includes('SameSite')) {
            return `${cookie}; SameSite=Strict`;
          }
          return cookie;
        });

        res.setHeader('Set-Cookie', updatedCookies);
      }

      next();
    };
  }
}

module.exports = CSRFProtection;
