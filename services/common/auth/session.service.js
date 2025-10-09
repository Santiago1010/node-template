// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../../config/database/connection');
const { wrapLogging } = require('../../../helpers/debug.helper');
const { error } = require('../../../helpers/response.helper');

// =============================================================================
// MODELS
// =============================================================================
const { usrAccounts } = sequelize.models;

class SessionService {
  static async login(credential, _) {
    const account = await usrAccounts.findOne({
      attributes: [
        'id',
        'userId',
        'employeeId',
        'internalCode',
        'email',
        'emailConfirmedAt',
        'mobileNumber',
        'mobileNumberConfirmedAt',
        'password',
      ],
      where: { [Op.or]: [{ internalCode: credential }, { email: credential }, { mobileNumber: credential }] },
      logging: wrapLogging('[SessionService.login] Get account by credential'),
    });

    if (!account) throw error({ httpCode: 404, messagePath: 'auth.login.accountNotFound' });

    if (credential === account.email && !account.emailConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.emailNotConfirmed' });
    }

    if (credential === account.mobileNumber && !account.mobileNumberConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.mobileNotConfirmed' });
    }

    return account;
  }
}

module.exports = SessionService;
