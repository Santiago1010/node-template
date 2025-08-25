const SessionService = require('../../services/auth/sessionWeb.service');

class SessionController {
  static async login(req, res, next) {
    const { credential, password } = req.body;

    try {
      const response = await SessionService.login(credential, password);

      return res.status(200).json(response);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SessionController;
