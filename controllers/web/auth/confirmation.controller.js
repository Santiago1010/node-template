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

      return success(res, { messagePath: 'auth.login.confirmationEmailSent' });
    } catch (error) {
      return next(error);
    }
  }

  static async confirmEmail(req, res, next) {
    const { token } = req.params;

    try {
      const confirmationService = new ConfirmationService();
      await confirmationService.initialize();

      await confirmationService.confirmEmail(token);

      return success(res, { messagePath: 'auth.login.emailConfirmed' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = ConfirmationController;
