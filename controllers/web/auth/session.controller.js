const { success } = require('../../../helpers/response.helper');

class SessionController {
  static async login(_, res, next) {
    // const { credential, password } = req.body;

    try {
      const response = {};

      return success(res, { httpCode: 200, messageData: 'auth.login', data: response });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SessionController;
