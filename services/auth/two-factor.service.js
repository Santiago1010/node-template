// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
// const dayjs = require('dayjs');
// const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionMailer = require('../emails/auth/session.email');
const AccountServices = require('../users/accounts.services');
const { getSequelize } = require('../../config/database/connection');
const { error } = require('../../helpers/response.helper');

class TwoFactorService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    this.accountService = new AccountServices(this.sequelize);

    this.sessionMailer = new SessionMailer();

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    this.accountService = new AccountServices(this.sequelize);

    return this;
  }

  async disable2FA(accountId) {
    const account = await this.accountService.getAccountDetails(accountId, { fields: ['id', 'twoFactorEnabled'] });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'TwoFactorService.accountNotFound' });
    }

    await account.update({ twoFactorEnabled: false });

    return true;
  }
}

module.exports = TwoFactorService;
