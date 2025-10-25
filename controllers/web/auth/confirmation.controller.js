const ConfirmationService = require('../../../services/common/auth/confirmation.service');
const { success } = require('../../../helpers/response.helper');

class ConfirmationController {
  static async sendConfirmationEmail(req, res, next) {
    const { email } = req.body;

    try {
      const confirmationService = new ConfirmationService();
      await confirmationService.initialize();

      const { firstName, token } = await confirmationService.sendConfirmationEmail(email);

      confirmationService.sessionMailer.sendWelcomeEmail(email, firstName, token);

      return success(res, { messagePath: 'auth.confirmEmail.confirmationEmailSent' });
    } catch (error) {
      return next(error);
    }
  }

  static async confirmEmail(req, res, next) {
    const { token } = req.params;
    const { password } = req.body;

    try {
      const confirmationService = new ConfirmationService();
      await confirmationService.initialize();

      await confirmationService.confirmEmail(token, 'confirm_email', password);

      return success(res, { messagePath: 'auth.confirmEmail.emailConfirmed' });
    } catch (error) {
      return next(error);
    }
  }

  static async confirmDevice(req, res, next) {
    const { jti } = req.user;
    const { token } = req.params;
    const { password, rely, block } = req.body;

    try {
      const confirmationService = new ConfirmationService();
      await confirmationService.initialize();

      await confirmationService.confirmDevice(token, 'secure_device', password, jti, rely, block);

      return success(res, { messagePath: 'auth.confirmDevice.deviceConfirmed' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = ConfirmationController;
