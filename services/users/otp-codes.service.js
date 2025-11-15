// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const dayjs = require('dayjs');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SMSService = require('../messages/sms');
const { getSequelize } = require('../../config/database/connection');
const { wrapLogging } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');
const { SECURITY_CONFIG } = require('../../utils/constants.util');

class OTPService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    return this;
  }

  async generateAndSendOTP(accountId, channel, purpose, destination) {
    if (purpose !== 'setup') {
      const account = await this.models.usrAccounts.findByPk(accountId, {
        attributes: ['id', 'twoFactorEnabled'],
        raw: true,
        logging: wrapLogging('[OTPService.generateAndSendOTP] Get account'),
      });

      if (!account) {
        throw error({ httpCode: 404, messagePath: 'otp.accountNotFound' });
      }

      if (!account.twoFactorEnabled && purpose !== 'setup') {
        throw error({ httpCode: 400, messagePath: 'otp.twoFactorNotEnabled' });
      }
    }

    const otpCode = SMSService.generateOTP(SECURITY_CONFIG.OTP.LENGTH);
    const expiresAt = dayjs()
      .add(SECURITY_CONFIG.OTP.EXPIRATION_MINUTES || 10, 'minutes')
      .toDate();

    await this.sequelize.transaction(async (transaction) => {
      await this.models.usrOtpCodes.destroy({
        where: {
          accountId,
          channel,
          purpose,
          usedAt: null,
          expiresAt: { [Op.gte]: dayjs().toDate() },
        },
        transaction,
        logging: wrapLogging('[OTPService.generateAndSendOTP] Invalidate previous OTP codes'),
      });

      await this.models.usrOtpCodes.create(
        {
          accountId,
          code: otpCode,
          channel,
          purpose,
          expiresAt,
        },
        {
          transaction,
          logging: wrapLogging('[OTPService.generateAndSendOTP] Create OTP code', {
            accountId,
            channel,
            purpose,
          }),
        }
      );
    });

    // Enviar código según el canal
    await this.sendOTPByChannel(channel, destination, otpCode, purpose);

    return {
      sent: true,
      expiresAt,
      channel,
    };
  }

  async verifyOTP(accountId, code, channel, purpose) {
    const now = dayjs().toDate();

    const otpRecord = await this.models.usrOtpCodes.findOne({
      attributes: ['id', 'accountId', 'code', 'expiresAt', 'usedAt'],
      where: {
        accountId,
        code,
        channel,
        purpose,
        expiresAt: { [Op.gte]: now },
        usedAt: null,
      },
      raw: true,
      logging: wrapLogging('[OTPService.verifyOTP] Get OTP code'),
    });

    if (!otpRecord) {
      throw error({ httpCode: 401, messagePath: 'otp.invalidOrExpiredCode' });
    }

    // Marcar código como usado
    await this.models.usrOtpCodes.update(
      { usedAt: now },
      {
        where: { id: otpRecord.id },
        logging: wrapLogging('[OTPService.verifyOTP] Mark OTP as used'),
      }
    );

    return true;
  }

  async enable2FA(accountId) {
    const account = await this.models.usrAccounts.findByPk(accountId, {
      attributes: ['id', 'twoFactorEnabled'],
      logging: wrapLogging('[OTPService.enable2FA] Get account'),
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'otp.accountNotFound' });
    }

    if (account.twoFactorEnabled) {
      throw error({ httpCode: 400, messagePath: 'otp.twoFactorAlreadyEnabled' });
    }

    await account.update({ twoFactorEnabled: true }, { logging: wrapLogging('[OTPService.enable2FA] Enable 2FA') });

    return true;
  }

  /**
   * Deshabilita la verificación en 2 pasos para una cuenta
   * @param {number} accountId - ID de la cuenta
   * @returns {Promise<boolean>}
   */
  async disable2FA(accountId) {
    const account = await this.models.usrAccounts.findByPk(accountId, {
      attributes: ['id', 'twoFactorEnabled'],
      logging: wrapLogging('[OTPService.disable2FA] Get account'),
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'otp.accountNotFound' });
    }

    if (!account.twoFactorEnabled) {
      throw error({ httpCode: 400, messagePath: 'otp.twoFactorNotEnabled' });
    }

    await this.sequelize.transaction(async (transaction) => {
      // Invalidar todos los códigos OTP pendientes
      await this.models.usrOtpCodes.destroy({
        where: {
          accountId,
          usedAt: null,
        },
        transaction,
        logging: wrapLogging('[OTPService.disable2FA] Invalidate all pending OTP codes'),
      });

      await account.update(
        { twoFactorEnabled: false },
        { transaction, logging: wrapLogging('[OTPService.disable2FA] Disable 2FA') }
      );
    });

    return true;
  }

  async sendOTPByChannel(channel, destination, code) {
    switch (channel) {
      case 'sms':
        await SMSService.sendOTPLogin(destination, code);
        break;
      case 'whatsapp':
        // TODO: Implement WhatsApp's service
        throw error({ httpCode: 501, messagePath: 'otp.whatsappNotImplemented' });
      case 'email':
        // TODO: Implement email's service
        throw error({ httpCode: 501, messagePath: 'otp.emailNotImplemented' });
      default:
        throw error({ httpCode: 400, messagePath: 'otp.invalidChannel' });
    }
  }

  async getOTPHistory(accountId, { limit = 10, purpose = null } = {}) {
    const where = { accountId };

    if (purpose) {
      where.purpose = purpose;
    }

    const history = await this.models.usrOtpCodes.findAll({
      attributes: ['id', 'channel', 'purpose', 'expiresAt', 'usedAt', 'createdAt'],
      where,
      order: [['createdAt', 'DESC']],
      limit,
      logging: wrapLogging('[OTPService.getOTPHistory] Get OTP history'),
    });

    return history;
  }
}

module.exports = OTPService;
