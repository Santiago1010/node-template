const SessionService = require('../../../services/common/auth/session.service');
const { success } = require('../../../helpers/response.helper');
const { getDeviceInfo } = require('../../../utils/utilities.util');

class SessionController {
  static async login(req, res, next) {
    const { credential, password } = req.body;

    try {
      const response = await SessionService.login(credential, password, getDeviceInfo(req, true));

      return success(res, { messagePath: 'auth.login', data: response });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SessionController;
