const SessionService = require('../../../services/common/auth/session.service');
const { success } = require('../../../helpers/response.helper');

class SessionController {
  static async login(req, res, next) {
    const { credential, password } = req.body;

    try {
      const response = await SessionService.login(credential, password);

      return success(res, { messagePath: 'auth.login', data: response });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SessionController;
