// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const dayjs = require('dayjs');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionMailer = require('../emails/auth/session.email');
const AccountServices = require('../users/accounts.services');
const CredentialsService = require('../users/credentials.services');
const OTPService = require('../users/otp-codes.service');
const { getSequelize } = require('../../config/database/connection');
const { error } = require('../../helpers/response.helper');
const { wrapLogging } = require('../../helpers/debug.helper');
const { SECURITY_CONFIG } = require('../../utils/constants.util');

class TwoFactorService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    this.accountService = new AccountServices(this.sequelize);
    this.credentialsService = new CredentialsService(this.sequelize);
    this.otpService = new OTPService(this.sequelize);
    this.sessionMailer = new SessionMailer();

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    this.accountService = new AccountServices(this.sequelize);
    this.otpService = new OTPService(this.sequelize);
    this.credentialsService = new CredentialsService(this.sequelize);

    return this;
  }

  async get2FAStatus(accountId) {
    const account = await this.accountService.getAccount({
      fields: ['id', 'twoFactorEnabled', 'dialCodeId'],
      userId: accountId,
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'get2FAStatus.accountNotFound' });
    }

    const phoneCredentials =
      account.credentials?.filter((cred) => cred.credentialtypeInt === 2 && cred.verifiedAt) || [];

    return {
      enabled: account.twoFactorEnabled,
      hasVerifiedPhone: phoneCredentials.length > 0,
      phoneNumber:
        phoneCredentials.length > 0
          ? phoneCredentials[0].dataValues.formattedNumber || phoneCredentials[0].credentialValue
          : null,
      dialCodeId: account.dialCodeId,
    };
  }

  async enable2FA(accountId, { dialCodeId, number, channel = 'sms' }) {
    const account = await this.accountService.getAccount({
      fields: ['id', 'twoFactorEnabled', 'dialCodeId'],
      userId: accountId,
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'enable2FA.accountNotFound' });
    }

    if (account.twoFactorEnabled) {
      throw error({ httpCode: 400, messagePath: 'enable2FA.alreadyEnabled' });
    }

    let phoneCredential = null;
    let destination = null;

    if (number && dialCodeId) {
      await account.update({ dialCodeId }, { logging: wrapLogging('[TwoFactorService.enable2FA] Update dialCodeId') });

      const existingCredentials =
        account.credentials?.filter((cred) => cred.credentialtypeInt === 2 && cred.credentialValue === number) || [];

      if (existingCredentials.length > 0) {
        phoneCredential = existingCredentials[0];
        destination = number;
      } else {
        phoneCredential = await this.credentialsService.createCredential(accountId, 'phone', number, {
          verified: false,
        });
        destination = number;
      }
    } else {
      const phoneCredentials =
        account.credentials?.filter((cred) => cred.credentialtypeInt === 2 && cred.verifiedAt) || [];

      if (phoneCredentials.length === 0) {
        throw error({ httpCode: 400, messagePath: 'enable2FA.noVerifiedPhone' });
      }

      phoneCredential = phoneCredentials[0];

      const fullNumber = phoneCredential.credentialValue;
      const dialCode = account.dialCode?.code || '';
      destination = fullNumber.replace(dialCode, '');
    }

    await this.otpService.generateAndSendOTP(accountId, channel, 'setup', destination);

    return {
      message: 'OTP sent successfully for 2FA setup',
      phoneNumber: phoneCredential.dataValues?.formattedNumber || phoneCredential.credentialValue,
      channel,
      expiresIn: (SECURITY_CONFIG.OTP.EXPIRATION_MINUTES || 10) * 60,
    };
  }

  async sendVerifyCode(accountId, { channel = 'sms', purpose = 'login' }) {
    const account = await this.accountService.getAccount({
      fields: ['id', 'twoFactorEnabled', 'dialCodeId'],
      userId: accountId,
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'sendVerifyCode.accountNotFound' });
    }

    if (!account.twoFactorEnabled && purpose === 'login') {
      throw error({ httpCode: 400, messagePath: 'sendVerifyCode.notEnabled' });
    }

    const phoneCredentials =
      account.credentials?.filter((cred) => cred.credentialtypeInt === 2 && cred.verifiedAt) || [];

    if (phoneCredentials.length === 0) {
      throw error({ httpCode: 400, messagePath: 'sendVerifyCode.noVerifiedPhone' });
    }

    const phoneCredential = phoneCredentials[0];

    const fullNumber = phoneCredential.credentialValue;
    const dialCode = account.dialCode?.code || '';
    const destination = fullNumber.replace(dialCode, '');

    const recentOTPs = await this.models.usrOtpCodes.count({
      where: { accountId, createdAt: { [Op.gte]: dayjs().subtract(5, 'minutes').toDate() } },
      logging: wrapLogging('[TwoFactorService.sendVerifyCode] Check rate limit'),
    });

    if (recentOTPs >= 3) {
      throw error({ httpCode: 429, messagePath: 'sendVerifyCode.tooManyAttempts', data: { retryAfter: 300 } });
    }

    await this.otpService.generateAndSendOTP(accountId, channel, purpose, destination);

    return {
      message: 'OTP sent successfully',
      phoneNumber: phoneCredential.dataValues?.formattedNumber || phoneCredential.credentialValue,
      channel,
      expiresIn: (SECURITY_CONFIG.OTP.EXPIRATION_MINUTES || 10) * 60,
    };
  }

  async verifyCode(accountId, otpCode, { purpose = 'login' } = {}) {
    const account = await this.accountService.getAccountDetails(accountId, {
      fields: ['id', 'twoFactorEnabled', 'dialCodeId'],
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'verifyCode.accountNotFound' });
    }

    try {
      await this.otpService.verifyOTP(accountId, otpCode, purpose);
    } catch (_) {
      throw error({ httpCode: 400, messagePath: 'verifyCode.invalidOrExpiredCode' });
    }

    if (purpose === 'setup') {
      await this.otpService.enable2FA(accountId);

      // TODO: Send email notifying the activation of 2FA
      // await this.sessionMailer.send2FAEnabled(account);

      return { message: '2FA enabled successfully', enabled: true };
    }

    return { message: 'Code verified successfully', verified: true };
  }

  async disable2FA(accountId) {
    const account = await this.accountService.getAccountDetails(accountId, {
      fields: ['id', 'twoFactorEnabled'],
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'disable2FA.accountNotFound' });
    }

    if (!account.twoFactorEnabled) {
      throw error({ httpCode: 400, messagePath: 'disable2FA.notEnabled' });
    }

    await this.otpService.disable2FA(accountId);

    // TODO: Send email notifying the deactivation of 2FA
    // await this.sessionMailer.send2FADisabled(account);

    return true;
  }
}

module.exports = TwoFactorService;
