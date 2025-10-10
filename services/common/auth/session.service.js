// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../../config/database/connection');
const config = require('../../../config/env');
const { wrapLogging } = require('../../../helpers/debug.helper');
const { error } = require('../../../helpers/response.helper');
const { createJWT } = require('../../../helpers/security.helper');

// =============================================================================
// MODELS
// =============================================================================
const { usrAccounts } = sequelize.models;

class SessionService {
  static async login(credential, password) {
    const account = await usrAccounts.findOne({
      attributes: [
        'id',
        'userId',
        'employeeId',
        'internalCode',
        'profile',
        'profileInt',
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

    if (!account.emailConfirmedAt && !account.mobileNumberConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.accountNotConfirmed' });
    }

    if (credential === account.email && !account.emailConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.emailNotConfirmed' });
    }

    if (credential === account.mobileNumber && !account.mobileNumberConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.mobileNotConfirmed' });
    }

    const validPassword = bcrypt.compareSync(password, account.password);
    if (!validPassword) throw error({ httpCode: 401, messagePath: 'auth.login.invalidPassword' });

    const accessToken = SessionService.createAccessToken(account);
    const refreshToken = SessionService.createRefreshToken(account);

    return { accessToken, refreshToken };
  }

  // =============================== HELPERS =============================== //
  static createAccessToken(account) {
    const payload = { accountId: account.id, internalCode: account.internalCode, email: account.email };

    if (account.userId) payload.userId = account.userId;
    if (account.employeeId) payload.employeeId = account.employeeId;

    return createJWT(payload, config.jwt.accessToken.secret, {
      subject: 'acces_token_' + account.internalCode,
      expiresIn: config.jwt.accessToken.expiration,
    });
  }

  static createRefreshToken(account) {
    return createJWT({ accountId: account.id, internalCode: account.internalCode }, config.jwt.refreshToken.secret, {
      subject: 'refresh_token_' + account.internalCode,
      expiresIn: config.jwt.refreshToken.expiration,
    });
  }
}

module.exports = SessionService;
