// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const AccessServices = require('../users/accesses.services');
const DeviceServices = require('../users/devices.services');
const SessionMailer = require('../../emails/auth/session.email');
const config = require('../../../config/env');
const ContextHelper = require('../../../helpers/context.helper');
const { getSequelize } = require('../../../config/database/connection');
const { wrapLogging } = require('../../../helpers/debug.helper');
const { error } = require('../../../helpers/response.helper');
const {
  createJWT,
  verifyJWT,
  hashPassword,
  verifyPassword,
  generateSecureToken,
} = require('../../../helpers/security.helper');
const { getSecret } = require('../../../helpers/vault.helper');
const { generateInternalCode } = require('../../../utils/utilities.util');

class SessionService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    this.accessTokenSecret = null;
    this.refreshTokenSecret = null;

    this.sessionMailer = new SessionMailer();

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    const { access_token_secret, refresh_token_secret } = await getSecret('jwt/' + ContextHelper.get('environment'));

    this.accessTokenSecret = access_token_secret;
    this.refreshTokenSecret = refresh_token_secret;

    this.accessesService = new AccessServices(this.sequelize);
    this.devicesService = new DeviceServices(this.sequelize);

    return this;
  }

  async signup(firstName, firstLastName, email, password, { preferences } = {}) {
    const hashedPassword = await hashPassword(password, 10);

    const defaultRole = await this.models.configRoles.findOne({
      attributes: ['id'],
      where: { target: 'everyone', isDefault: true },
      raw: true,
      logging: wrapLogging('[SessionService.signup] Get default role'),
    });

    if (!defaultRole) throw error({ httpCode: 500, messagePath: 'auth.signup.defaultRoleNotFound' });

    const createUserData = { firstName, firstLastName };

    const createAccountData = {
      rolId: defaultRole.id,
      userId: null,
      password: hashedPassword,
    };

    const createCredentialData = [
      {
        accountId: null,
        credentialType: 'internal_code',
        credentialValue: generateInternalCode('account'),
        verifiedAt: moment().toDate(),
      },
      {
        accountId: null,
        credentialType: 'email',
        credentialValue: email,
        verifiedAt: null,
      },
    ];

    const createTokenData = {
      accountId: null,
      token: generateSecureToken(),
      purpose: 'confirm_email',
      expiresIn: moment().add(1, 'hour').toDate(),
    };

    const existingCredential = await this.models.usrCredentials.findOne({
      attributes: ['id'],
      where: { credentialType: 'email', credentialValue: email },
      raw: true,
      logging: wrapLogging('[SessionService.signup] Get existing credential'),
    });

    if (existingCredential) throw error({ httpCode: 400, messagePath: 'auth.signup.accountExists' });

    await this.sequelize.transaction(async (transaction) => {
      const user = await this.models.usrUsers.create(createUserData, {
        transaction,
        logging: wrapLogging('[SessionService.signup] Create user', createUserData),
      });

      createAccountData.userId = user.id;

      const account = await this.models.usrAccounts.create(createAccountData, {
        transaction,
        logging: wrapLogging('[SessionService.signup] Create account', createAccountData),
      });

      createTokenData.accountId = account.id;

      for (const credential of createCredentialData) {
        credential.accountId = account.id;

        await this.models.usrCredentials.create(credential, {
          transaction,
          logging: wrapLogging('[SessionService.signup] Create credential', credential),
        });
      }

      await this.models.usrTokens.create(createTokenData, {
        transaction,
        logging: wrapLogging("[SessionService.signup] Create token for account's confirmation", createTokenData),
      });

      if (preferences?.lang && preferences?.timezone) {
        const [language, timezone] = await Promise.all([
          this.models.dataLanguages.findOne({
            attributes: ['id'],
            where: { abbreviation: preferences?.lang },
            raw: true,
          }),
          this.models.dataTimezones.findOne({ attributes: ['id'], where: { name: preferences?.timezone }, raw: true }),
        ]);

        const createPreferencesData = {
          accountId: account.id,
          languageId: language?.id,
          timezoneId: timezone?.id,
          theme: preferences.theme,
        };

        if (createPreferencesData.languageId && createPreferencesData.timezoneId) {
          await this.models.usrPreferences.create(createPreferencesData, {
            transaction,
            logging: wrapLogging('[SessionService.signup] Create user preferences', createPreferencesData),
          });
        }
      }
    });

    return createTokenData.token;
  }

  async login(credential, password, fingerprint, device) {
    const credentialRecord = await this.models.usrCredentials.findOne({
      attributes: ['id', 'accountId', 'credentialType', 'credentialValue', 'verifiedAt'],
      where: { credentialValue: credential, verifiedAt: { [Op.not]: null } },
      include: {
        model: this.models.usrAccounts,
        as: 'account',
        attributes: ['id', 'userId', 'password'],
        required: true,
        include: {
          model: this.models.configRoles,
          as: 'rol',
          attributes: ['id', 'name'],
          required: true,
        },
      },
      logging: wrapLogging('[SessionService.login] Get credential by value'),
    });

    if (!credentialRecord) {
      throw error({ httpCode: 404, messagePath: 'auth.login.invalidCredentials' });
    }

    const account = credentialRecord.account;

    const validPassword = await verifyPassword(password, account.password);
    if (!validPassword) {
      throw error({ httpCode: 401, messagePath: 'auth.login.invalidCredentials' });
    }

    const accountData = { id: account.id, userId: account.userId, rol: account.rol };

    return await this.createTokens(accountData, fingerprint, device);
  }

  async logout(user, accountId, jti) {
    const access = await this.accessesService.getListAccesses({ limit: 1, page: 1, active: true, accountId, jti });

    if (!access.results.length === 0) {
      throw error({ httpCode: 404, messagePath: 'auth.logout.sessionNotFound' });
    }

    await this.accessesService.updateAccess(access.results[0].id, { active: false, user });

    return true;
  }

  // =============================== TOKENS ================================ //
  async createTokens(account, fingerprint, device) {
    const managedDevice = await this.manageDevice(account.id, fingerprint, device);

    const isSafeMode = !managedDevice.isTrusted;

    const accessToken = this.createAccessToken(account, isSafeMode);
    const refreshToken = this.createRefreshToken(account, managedDevice);

    const payloadRefreshToken = this.validRefreshToken(refreshToken, account);
    if (!payloadRefreshToken.jti) throw error({ httpCode: 401, messagePath: 'auth.login.invalidCredentials' });

    const { pagination, results } = await this.accessesService.getListAccesses({
      limit: 5,
      page: 1,
      active: true,
      accountId: account.id,
      deviceId: managedDevice.id,
      notBefore: moment().valueOf(),
    });

    if (pagination.total === 0) {
      await this.accessesService.createAccess(
        account.id,
        managedDevice.id,
        payloadRefreshToken.jti,
        moment(payloadRefreshToken.exp * 1000).valueOf(),
        { isSafeMode }
      );
    } else {
      await this.accessesService.updateAccess(results[0].id, {
        accountId: account.id,
        deviceId: managedDevice.id,
        idToken: payloadRefreshToken.jti,
        expiresAt: moment(payloadRefreshToken.exp * 1000).valueOf(),
        isSafeMode,
      });
    }

    return { accountId: account.id, isSafeMode, accessToken, refreshToken };
  }

  createAccessToken(account, isSafeMode) {
    // Obtener una credencial verificada del tipo internal_code o usar el ID
    const internalCode = account.internalCode || `ACC_${account.id}`;
    const payload = { internalCode, isSafeMode, role: account.rol.name };

    return createJWT(payload, this.accessTokenSecret, {
      subject: 'acces_token_' + internalCode,
      expiresIn: config.jwt.accessToken.expiration,
    });
  }

  createRefreshToken(account, device) {
    const internalCode = account.internalCode || `ACC_${account.id}`;
    const payload = {
      internalCode,
      device: { fingerprint: device.fingerprint, name: device.name, browser: device.browser, os: device.os },
    };

    return createJWT(payload, this.refreshTokenSecret, {
      subject: 'refresh_token_' + internalCode,
      expiresIn: config.jwt.refreshToken.expiration,
    });
  }

  validRefreshToken(refreshToken, account) {
    const internalCode = account.internalCode || `ACC_${account.id}`;
    const payload = verifyJWT(refreshToken, this.refreshTokenSecret, {
      subject: 'refresh_token_' + internalCode,
    });

    return payload;
  }

  // ================================ DEVICE ================================ //
  async manageDevice(accountId, fingerprint, { deviceType, userAgent, browser, os, ip }) {
    const lastUsedAt = moment().valueOf();

    const existingDevice = await this.devicesService.registeredDevice(accountId, fingerprint, deviceType, browser, os);

    if (!existingDevice) {
      return await this.devicesService.createDevice(accountId, fingerprint, {
        name: userAgent,
        type: deviceType,
        browser,
        os,
        lastIp: ip,
        lastUsedAt,
      });
    }

    return await this.devicesService.updateDevice(existingDevice.id, { name: userAgent, lastIp: ip, lastUsedAt });
  }
}

module.exports = SessionService;
