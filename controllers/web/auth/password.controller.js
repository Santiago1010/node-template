const PasswordService = require('../../../services/auth/password.service');
const { success } = require('../../../helpers/response.helper');
const { getDeviceInfo } = require('../../../utils/utilities.util');

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

  static async recoverPassword(req, res, next) {
    const { token, password } = req.body;

    try {
      const passwordService = new PasswordService();
      await passwordService.initialize();

      const email = await passwordService.recoverPassword(token, password);

      const deviceInfo = getDeviceInfo(req, true);
      passwordService.passwordMailer.sendPasswordChangedEmail(email, deviceInfo);

      return success(res, { messagePath: 'auth.recoverPassword.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = PasswordController;
