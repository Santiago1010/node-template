const config = require('../../../config/env');
const SessionService = require('../../../services/common/auth/session.service');
const { isDevelopmentMode } = require('../../../helpers/debug.helper');
const { success } = require('../../../helpers/response.helper');
const { getDeviceInfo } = require('../../../utils/utilities.util');

class SessionController {
  static async login(req, res, next) {
    const { credential, password, fingerprint } = req.body;

    try {
      const response = await SessionService.login(credential, password, fingerprint, getDeviceInfo(req, true));

      const { accessToken, refreshToken } = response;

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
