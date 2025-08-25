// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { jwt: config } = require('../../config/env');
const { registerError } = require('../../helpers/debug.helper');
const { verifyJWT } = require('../../helpers/security.helper');

// =============================================================================
// MIDDLEWARE's SETUP
// =============================================================================

const validAccessToken = async (accessToken, next) => {
  try {
    const decoded = verifyJWT(accessToken, config.accessToken.secret, { subject: config.accessToken.subject });

    const { sub, exp, ...cleanData } = decoded;

    return cleanData;
  } catch (error) {
    return next(error);
  }
};

const validRefreshToken = async (refreshToken, next) => {
  try {
    const decoded = verifyJWT(refreshToken, config.accessToken.secret, { subject: config.accessToken.subject });

    const { sub, exp, ...cleanData } = decoded;

    return cleanData;
  } catch (error) {
    return next(error);
  }
};

const validSessionTokens = async (req, _, next) => {
  try {
    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken || !refreshToken) {
      return next(
        registerError('Missing access token or refresh token', 401, {
          location: 'middlewares/web/session.middleware.js::validSessionTokens',
          code: 'MISSING_SESSION_TOKENS',
        })
      );
    }

    await validRefreshToken(refreshToken, next);
    const validAccess = await validAccessToken(accessToken, next);

    req.user = validAccess;
  } catch (error) {
    return next(
      registerError(error.message, 401, {
        location: 'middlewares/web/session.middleware.js::validSessionTokens',
        code: error.code,
      })
    );
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { validAccessToken, validRefreshToken, validSessionTokens };
