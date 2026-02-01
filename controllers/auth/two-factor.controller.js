const TwoFactorService = require('../../services/auth/two-factor.service');
const { success } = require('../../helpers/response.helper');

class TwoFactorController {
  static async get2FAStatus(req, res, next) {
    const { accountId } = req.user;

    try {
      const twoFactorService = new TwoFactorService();
      await twoFactorService.initialize();

      const status = await twoFactorService.get2FAStatus(accountId);

      return success(res, { data: status, messagePath: 'auth.get2FAStatus.success' });
    } catch (error) {
      return next(error);
    }
  }

  static async enable2FA(req, res, next) {
    const { accountId } = req.user;
    const { dialCodeId, number, channel = 'sms' } = req.body;

    try {
      const twoFactorService = new TwoFactorService();
      await twoFactorService.initialize();

      const result = await twoFactorService.enable2FA(accountId, { dialCodeId, number, channel });

      return success(res, { data: result, messagePath: 'auth.enable2FA.otpSent' });
    } catch (error) {
      return next(error);
    }
  }

  static async sendVerifyCode(req, res, next) {
    const { accountId } = req.user;
    const { channel = 'sms', purpose = 'login' } = req.body;

    try {
      const twoFactorService = new TwoFactorService();
      await twoFactorService.initialize();

      const result = await twoFactorService.sendVerifyCode(accountId, { channel, purpose });

      return success(res, { data: result, messagePath: 'auth.sendVerifyCode.success' });
    } catch (error) {
      return next(error);
    }
  }

  static async verifyOTP(req, res, next) {
    const { accountId } = req.user;
    const { otpCode, purpose = 'login' } = req.body;

    try {
      const twoFactorService = new TwoFactorService();
      await twoFactorService.initialize();

      const result = await twoFactorService.verifyCode(accountId, otpCode, { purpose });

      return success(res, { data: result, messagePath: 'auth.verifyCode.success' });
    } catch (error) {
      return next(error);
    }
  }

  static async disable2FA(req, res, next) {
    const { accountId } = req.user;

    try {
      const twoFactorService = new TwoFactorService();
      await twoFactorService.initialize();

      await twoFactorService.disable2FA(accountId);

      // TODO: Send email notifying the disabling of 2FA

      return success(res, { messagePath: 'auth.disable2FA.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = TwoFactorController;
