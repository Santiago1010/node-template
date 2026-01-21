const TwoFactorService = require('../../../services/auth/two-factor.service');
const { success } = require('../../../helpers/response.helper');

class TwoFactorController {
  static async disable2FA(req, res, next) {
    const { accountId } = req.user;

    try {
      const sessionService = new TwoFactorService();
      await sessionService.initialize();

      await sessionService.disable2FA(accountId);

      // TODO: Send an email notifying the disabling of 2-factor authentication.

      return success(res, { messagePath: 'auth.disable2FA.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = TwoFactorController;
