// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const connection = require('../../config/database/connection');
const i18n = require('../../config/i18n');
const { wrapLogging, registerError } = require('../../helpers/debug.helper');

const { usrAccounts } = connection.models;

class SessionService {
  static async login(credential, password) {
    const account = await usrAccounts.findOne({
      attributes: [
        'id',
        'rolId',
        'userId',
        'employeeId',
        'internalCode',
        'email',
        'mobileNumber',
        'mobileNumberConfirmedAt',
      ],
      where: {
        [Op.or]: [{ internalCode: credential }, { email: credential }, { mobileNumber: credential }],
        emailConfirmedAt: { [Op.not]: null },
      },
      logging: wrapLogging('[SessionService.login] get account'),
    });

    if (!account) {
      throw registerError(i18n.__('errors.login.accountNotFound'), 404, {
        location: 'SessionService.login',
        code: 'NOT_FOUND',
      });
    }

    console.log(account);

    return { credential, password };
  }
}

module.exports = SessionService;
