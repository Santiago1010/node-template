// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const connection = require('../../config/database/connection');
const { wrapLogging } = require('../../helpers/debug.helper');

const { usrAccounts } = connection.models;

class SessionService {
  static async login(credential, password) {
    const account = await usrAccounts.findOne({
      where: {
        [Op.or]: [{ internalCode: credential }, { email: credential }, { mobileNumber: credential }],
      },
      logging: wrapLogging('[SessionService.login] get account'),
    });

    console.log(account);

    return { credential, password };
  }
}

module.exports = SessionService;
