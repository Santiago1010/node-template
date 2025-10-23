// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionMailer = require('../../emails/auth/session.email');
const { getSequelize } = require('../../../config/database/connection');
const { wrapLogging } = require('../../../helpers/debug.helper');
const { error } = require('../../../helpers/response.helper');
const { generateSecureToken } = require('../../../helpers/security.helper');

class ConfirmationService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    this.sessionMailer = new SessionMailer();

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    return this;
  }

  async sendConfirmationEmail(email) {
    const account = await this.models.usrAccounts.findOne({
      attributes: ['id', 'userId', 'employeeId', 'email', 'emailConfirmedAt'],
      where: { email },
      raw: true,
      logging: wrapLogging('[ConfirmationService.sendConfirmationEmail] Get account by email'),
    });

    if (!account) throw error({ httpCode: 404, messagePath: 'auth.login.invalidCredentials' });

    const createTokenData = {
      accountId: account.id,
      token: generateSecureToken(),
      purpose: 'confirm_email',
      expiresIn: moment().add(1, 'hour').toDate(),
    };

    await this.sequelize.transaction(async (transaction) => {
      await this.models.usrTokens.destroy({
        where: { accountId: account.id, purpose: 'confirm_email', usedAt: null },
        transaction,
        logging: wrapLogging(
          '[ConfirmationService.sendConfirmationEmail] Destroy previous tokens not used to validate email',
          {
            accountId: account.id,
            purpose: 'confirm_email',
            usedAt: null,
          }
        ),
      });

      await this.models.usrTokens.create(createTokenData, {
        transaction,
        logging: wrapLogging(
          "[ConfirmationService.sendConfirmationEmail] Create token for account's confirmation",
          createTokenData
        ),
      });
    });

    let firstName = null;

    if (account.userId) {
      const user = await this.models.usrUsers.findByPk(account.userId, {
        attributes: ['firstName'],
        raw: true,
        logging: wrapLogging('[ConfirmationService.sendConfirmationEmail] Get user by id'),
      });

      firstName = user.firstName;
    } else if (account.employeeId) {
      const employee = await this.models.usrEmployees.findByPk(account.employeeId, {
        attributes: ['firstName'],
        raw: true,
        logging: wrapLogging('[ConfirmationService.sendConfirmationEmail] Get employee by id'),
      });

      firstName = employee.firstName;
    }

    return { firstName, token: createTokenData.token };
  }

  async confirmEmail(token, purpose) {
    const now = moment().toDate();

    const tokenDb = await this.models.usrTokens.findOne({
      attributes: ['id', 'accountId'],
      where: { token, purpose, expiresIn: { [Op.gte]: now }, usedAt: null },
      include: {
        model: this.models.usrAccounts,
        as: 'account',
        attributes: [],
        where: { emailConfirmedAt: null },
        required: true,
      },
      raw: true,
      logging: wrapLogging('[ConfirmationService.confirmEmail] Get token by token'),
    });

    if (!tokenDb) throw error({ httpCode: 404, messagePath: 'auth.confirmEmail.invalidToken' });

    await this.sequelize.transaction(async (transaction) => {
      await this.models.usrTokens.destroy({
        where: { id: { [Op.ne]: tokenDb.id }, accountId: tokenDb.accountId, purpose, usedAt: null },
        transaction,
        logging: wrapLogging('[ConfirmationService.confirmEmail] Destroy previous tokens not used to validate email', {
          id: { [Op.ne]: tokenDb.id },
          accountId: tokenDb.accountId,
          purpose,
          usedAt: null,
        }),
      });
    });

    return true;
  }
}

module.exports = ConfirmationService;
