const PasswordService = require('../../../services/auth/password.service');
const { success } = require('../../../helpers/response.helper');

class PasswordController {
  static async fogotPassword(req, res, next) {
    const { email } = req.body;

    try {
      const passwordService = new PasswordService();
      await passwordService.initialize();

      const token = await passwordService.fogotPassword(email);

      passwordService.passwordMailer.sendPasswordResetEmail(email, token);

      return success(res, { messagePath: 'auth.fogotPassword.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = PasswordController;
