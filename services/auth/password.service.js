// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const dayjs = require('dayjs');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const TokenServices = require('../users/tokens.services');
const PasswordMailer = require('../emails/auth/password.email');
const { getSequelize } = require('../../config/database/connection');
const { wrapLogging, perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');
const { generateSecureToken, hashPassword, verifyPassword } = require('../../helpers/security.helper');

class PasswordService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    this.passwordMailer = new PasswordMailer();

    this.tokenService = new TokenServices(this.sequelize);

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    this.tokenService = new TokenServices(this.sequelize);

    return this;
  }

  async fogotPassword(email) {
    const account = await this.models.usrAccounts.findOne({
      attributes: ['id'],
      include: {
        model: this.models.usrCredentials,
        as: 'credentials',
        attributes: [],
        where: { credentialType: 'email', credentialValue: email, verifiedAt: { [Op.not]: null } },
        required: true,
      },
      subQuery: false,
      logging: wrapLogging('[PasswordService.fogotPassword] Get account by email'),
    });

    if (!account) {
      perror('[PasswordService.fogotPassword] No account found or not verified', { email });

      throw error({ httpCode: 404, messagePath: 'auth.fogotPassword.invalidCredentials' });
    }

    const token = generateSecureToken();
    const expiresIn = dayjs().add(1, 'hour').toDate();

    await this.tokenService.createToken(account.id, token, 'recover_password', expiresIn);

    return token;
  }

  async recoverPassword(token, password) {
    const now = dayjs().toDate();

    const tokenDb = await this.tokenService.getToken({
      token,
      purpose: 'recover_password',
      active: true,
      customWhere: { expiresIn: { [Op.gte]: now }, usedAt: null },
    });

    if (!tokenDb) {
      perror('[PasswordService.recoverPassword] No token found', {
        token,
        purpose: 'recover_password',
        active: true,
        customWhere: { expiresIn: { [Op.gte]: now }, usedAt: null },
      });

      throw error({ httpCode: 404, messagePath: 'auth.recoverPassword.invalidToken' });
    }

    const account = await this.models.usrAccounts.findByPk(tokenDb.accountId, {
      logging: wrapLogging('[PasswordService.recoverPassword] Get account by id'),
    });

    if (!account) {
      perror('[PasswordService.recoverPassword] No account found', { accountId: tokenDb.accountId });

      throw error({ httpCode: 404, messagePath: 'auth.recoverPassword.accountNotFound' });
    }

    await this.sequelize.transaction(async (transaction) => {
      await this.tokenService.useAToken(tokenDb.accountId, token, 'recover_password', now, { t: transaction });

      await account.update(
        { password: await hashPassword(password) },
        { transaction, logging: wrapLogging('[PasswordService.recoverPassword] Update account password') }
      );
    });

    const credential = await this.models.usrCredentials.findOne({
      where: { accountId: account.id, credentialType: 'email', verifiedAt: { [Op.not]: null } },
      logging: wrapLogging('[PasswordService.recoverPassword] Get credentials by account id'),
    });

    if (!credential) {
      perror('[PasswordService.recoverPassword] No credential found', {
        accountId: account.id,
        credentialType: 'email',
        verifiedAt: { [Op.not]: null },
      });

      throw error({ httpCode: 404, messagePath: 'auth.recoverPassword.credentialNotFound' });
    }

    return credential.credentialValue;
  }

  async changePassword(accountId, currentPassword, newPassword) {
    const account = await this.models.usrAccounts.findByPk(accountId, {
      logging: wrapLogging('[PasswordService.changePassword] Get account by id'),
    });

    if (!account) {
      perror('[PasswordService.changePassword] No account found', { accountId });

      throw error({ httpCode: 404, messagePath: 'auth.changePassword.accountNotFound' });
    }

    const validPassword = await verifyPassword(currentPassword, account.password);
    if (!validPassword) {
      throw error({ httpCode: 401, messagePath: 'auth.changePassword.invalidCredentials' });
    }

    const repeatedPassword = await verifyPassword(newPassword, account.password);
    if (repeatedPassword) {
      throw error({ httpCode: 400, messagePath: 'auth.changePassword.repeatPassword' });
    }

    await account.update(
      { password: await hashPassword(newPassword) },
      { logging: wrapLogging('[PasswordService.changePassword] Update account password') }
    );
  }
}

module.exports = PasswordService;
