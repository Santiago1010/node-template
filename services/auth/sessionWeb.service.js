// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const bcrypt = require('bcrypt');
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

    if (account.mobileNumber === credential && account.mobileNumberConfirmedAt === null) {
      throw registerError(i18n.__('errors.login.accountNotConfirmed'), 400, {
        location: 'SessionService.login',
        code: 'NOT_CONFIRMED',
      });
    }

    if (!account.password) {
      throw registerError(i18n.__('errors.login.invalidPassword'), 500, {
        location: 'SessionService.login',
        code: 'INVALID_PASSWORD',
      });
    }

    const validPassword = await bcrypt.compare(password, account.password);

    if (!validPassword) {
      throw registerError(i18n.__('errors.login.invalidPassword'), 401, {
        location: 'SessionService.login',
        code: 'INVALID_PASSWORD',
      });
    }

    return { id: account.id, rolId: account.rolId, userId: account.userId, employeeId: account.employeeId };
  }
}

module.exports = SessionService;
