// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
// const dayjs = require('dayjs');
// const { Op, col } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const TokenServices = require('../users/tokens.services');
const SessionMailer = require('../emails/auth/session.email');
const { getSequelize } = require('../../config/database/connection');
// const { wrapLogging } = require('../../helpers/debug.helper');
// const { error } = require('../../helpers/response.helper');
// const { generateSecureToken, verifyPassword } = require('../../helpers/security.helper');

class PasswordService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    this.sessionMailer = new SessionMailer();

    this.tokenService = new TokenServices(this.sequelize);

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    return this;
  }
}

module.exports = PasswordService;
