const dayjs = require('dayjs');

const config = require('../../../config/env');
const SessionService = require('../../../services/common/auth/session.service');
const { isDevelopmentMode, clog } = require('../../../helpers/debug.helper');
const { del, buildKey, increment, tagKey, set, ttl } = require('../../../helpers/cache.helper');
const { success, error } = require('../../../helpers/response.helper');
const { getDeviceInfo } = require('../../../utils/utilities.util');

class SessionController {
  static async signup(req, res, next) {
    const { firstName, firstLastName, email, password, preferences } = req.body;

    try {
      const sessionService = new SessionService();
      await sessionService.initialize();

      const token = await sessionService.signup(firstName, firstLastName, email, password, { preferences });

      sessionService.sessionMailer.sendWelcomeEmail(email, firstName, token);

      return success(res, { messagePath: 'auth.signup.success' });
    } catch (error) {
      return next(error);
    }
  }

  static async login(req, res, next) {
    const { credential, password } = req.body;

    try {
      const sessionService = new SessionService();
      await sessionService.initialize();

      const deviceInfo = getDeviceInfo(req, true);
      const rateLimitKey = buildKey('rate_limit', 'login', req.ip);

      const attempts = await increment(rateLimitKey);

      if (attempts === 1) {
        await set(rateLimitKey, attempts, 900);
      }

      if (attempts > 5) {
        const remainingTTL = await ttl(rateLimitKey);
        // throw new Error(`Too many login attempts. Try again in ${Math.ceil(remainingTTL / 60)} minutes`);
        throw error({
          httpCode: 429,
          messagePath: 'auth.login.tooManyAttempts',
          messageData: { remainingTTL: Math.ceil(remainingTTL / 60) },
        });
      }

      const fingerprint = req.headers['x-fingerprint'];

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
          loginAt: dayjs().toISOString(),
        },
        Math.floor(config.jwt.accessToken.expiration / 1000)
      );

      await tagKey(sessionKey, [`account:${accountId}`, 'active_sessions']);

      clog('access token', accessToken);
      clog('refresh token', refreshToken);

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

      await sessionService.sessionMailer.sendWelcomeEmail({ name: 'Santiago', email: 'santiago.c.a_10@hotmail.es' });

      return success(res, { messagePath: 'auth.login.success' });
    } catch (error) {
      return next(error);
    }
  }

  static async refreshToken(req, res, next) {
    console.dir(req.user, { depth: null });

    try {
      return success(res, { httpCode: 204 });
    } catch (error) {
      return next(error);
    }
  }

  static async logout(req, res, next) {
    const { account, jti, device } = req.user;

    try {
      console.log(req.user);

      const sessionService = new SessionService();
      await sessionService.initialize();

      await sessionService.logout(req.user, account.id, jti);

      const sessionKey = buildKey('session', account.id, device.fingerprint);
      await del(sessionKey);

      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: !isDevelopmentMode(true),
        sameSite: 'strict',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: !isDevelopmentMode(true),
        sameSite: 'strict',
      });

      return success(res, { messagePath: 'auth.logout.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SessionController;
