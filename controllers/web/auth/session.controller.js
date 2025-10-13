const moment = require('moment');

const config = require('../../../config/env');
const SessionService = require('../../../services/common/auth/session.service');
const { isDevelopmentMode } = require('../../../helpers/debug.helper');
const { del, buildKey, increment, tagKey, set, ttl } = require('../../../helpers/cache.helper');
const { success } = require('../../../helpers/response.helper');
const { getDeviceInfo } = require('../../../utils/utilities.util');

class SessionController {
  static async login(req, res, next) {
    const { credential, password, fingerprint } = req.body;

    try {
      const sessionService = await new SessionService().initialize();

      const deviceInfo = getDeviceInfo(req, true);
      const rateLimitKey = buildKey('rate_limit', 'login', req.ip);

      const attempts = await increment(rateLimitKey);

      if (attempts === 1) {
        await set(rateLimitKey, attempts, 900);
      }

      if (attempts > 5) {
        const varTtl = await ttl(rateLimitKey);
        throw new Error(`Too many login attempts. Try again in ${Math.ceil(varTtl / 60)} minutes`);
      }

      const response = await sessionService.login(credential, password, fingerprint, deviceInfo);

      const { accessToken, refreshToken, accountId } = response;

      await del(rateLimitKey);

      const sessionKey = buildKey('session', accountId, fingerprint);
      await set(
        sessionKey,
        {
          userId: accountId,
          fingerprint,
          deviceInfo,
          loginAt: moment().toISOString(),
        },
        Math.floor(config.jwt.accessToken.expiration / 1000)
      );

      await tagKey(sessionKey, [`account:${accountId}`, 'active_sessions']);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: !isDevelopmentMode(true),
        sameSite: 'strict',
        maxAge: config.jwt.accessToken.expiration,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: !isDevelopmentMode(true),
        sameSite: 'strict',
        maxAge: config.jwt.refreshToken.expiration,
      });

      return success(res, { messagePath: 'auth.login.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SessionController;
