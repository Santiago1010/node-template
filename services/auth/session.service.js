// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const dayjs = require('dayjs');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const AccessServices = require('../users/accesses.services');
const CredentialServices = require('../users/credentials.services');
const DeviceServices = require('../users/devices.services');
const PreferenceServices = require('../users/preferences.services');
const TokenServices = require('../users/tokens.services');
const UserServices = require('../users/users.services');
const OTPService = require('../users/otp-codes.service');
const SessionMailer = require('../emails/auth/session.email');
const config = require('../../config/env');
const ContextHelper = require('../../helpers/context.helper');
const { getSequelize } = require('../../config/database/connection');
const { wrapLogging } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');
const {
  createJWT,
  verifyJWT,
  hashPassword,
  verifyPassword,
  generateSecureToken,
} = require('../../helpers/security.helper');
const { getSecret } = require('../../helpers/vault.helper');
const { generateInternalCode } = require('../../utils/utilities.util');

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
    this.credentialsService = new CredentialServices(this.sequelize);
    this.devicesService = new DeviceServices(this.sequelize);
    this.preferenceService = new PreferenceServices(this.sequelize);
    this.tokensService = new TokenServices(this.sequelize);
    this.usersService = new UserServices(this.sequelize);
    this.otpService = new OTPService(this.sequelize);

    return this;
  }

  async signup(firstName, firstLastName, email, password, { preferences } = {}) {
    const hashedPassword = await hashPassword(password, 10);

    const defaultRole = await this.models.configRoles.findOne({
      attributes: ['id'],
      where: { target: 'customer', isDefault: true },
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
        verifiedAt: dayjs().toISOString(),
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
      expiresIn: dayjs().add(1, 'hour').toDate(),
    };

    const existingCredential = await this.models.usrCredentials.findOne({
      attributes: ['id'],
      where: { credentialType: 'email', credentialValue: email },
      raw: true,
      logging: wrapLogging('[SessionService.signup] Get existing credential'),
    });

    if (existingCredential) throw error({ httpCode: 400, messagePath: 'auth.signup.accountExists' });

    await this.sequelize.transaction(async (transaction) => {
      const user = await this.usersService.createUser(createUserData.firstName, createUserData.firstLastName, {
        t: transaction,
      });

      createAccountData.userId = user.id;

      const account = await this.models.usrAccounts.create(createAccountData, {
        transaction,
        logging: wrapLogging('[SessionService.signup] Create account', createAccountData),
      });

      for (const credential of createCredentialData) {
        await this.credentialsService.createCredential(
          account.id,
          credential.credentialType,
          credential.credentialValue,
          { verifiedAt: credential.verifiedAt, t: transaction }
        );
      }

      await this.tokensService.createToken(
        account.id,
        createTokenData.token,
        createTokenData.purpose,
        createTokenData.expiresIn,
        { t: transaction }
      );

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
          languageId: language?.id,
          timezoneId: timezone?.id,
          theme: preferences.theme,
        };

        if (createPreferencesData.languageId && createPreferencesData.timezoneId) {
          await this.preferenceService.createPreference(
            account.id,
            createPreferencesData.languageId,
            createPreferencesData.timezoneId,
            { theme: createPreferencesData.theme, t: transaction }
          );
        }
      }
    });

    return createTokenData.token;
  }

  /**
   * Login paso 1: Verifica credenciales y envía OTP si 2FA está habilitado
   */
  async login(credential, password, fingerprint, device) {
    const credentialRecord = await this.models.usrCredentials.findOne({
      attributes: ['id', 'accountId', 'credentialType', 'credentialValue', 'verifiedAt'],
      where: { credentialValue: credential, verifiedAt: { [Op.not]: null } },
      include: {
        model: this.models.usrAccounts,
        as: 'account',
        attributes: ['id', 'userId', 'password', 'twoFactorEnabled', 'dialCodeId'],
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

    if (account.twoFactorEnabled) {
      const phoneCredential = await this.models.usrCredentials.findOne({
        attributes: ['credentialValue'],
        where: {
          accountId: account.id,
          credentialType: 'phone',
          verifiedAt: { [Op.not]: null },
        },
        raw: true,
        logging: wrapLogging('[SessionService.login] Get phone credential'),
      });

      if (!phoneCredential) {
        throw error({ httpCode: 400, messagePath: 'auth.login.noPhoneForOTP' });
      }

      const otpResult = await this.otpService.generateAndSendOTP(
        account.id,
        'sms',
        'login',
        phoneCredential.credentialValue
      );

      return {
        requires2FA: true,
        accountId: account.id,
        otpSent: true,
        otpChannel: 'sms',
        expiresAt: otpResult.expiresAt,
      };
    }

    const accountData = { id: account.id, userId: account.userId, rol: account.rol };
    const responseTokens = await this.createTokens(accountData, fingerprint, device);

    if (responseTokens.isSafeMode) {
      const createdToken = await this.tokensService.createToken(
        account.id,
        generateSecureToken(),
        'secure_device',
        dayjs().add(1, 'day').toDate()
      );

      if (createdToken) responseTokens.secureToken = createdToken.token;
    }

    return responseTokens;
  }

  async verifyLoginOTP(accountId, otpCode, channel, fingerprint, device) {
    await this.otpService.verifyOTP(accountId, otpCode, channel, 'login');

    const account = await this.models.usrAccounts.findOne({
      attributes: ['id', 'userId'],
      where: { id: accountId },
      include: {
        model: this.models.configRoles,
        as: 'rol',
        attributes: ['id', 'name'],
        required: true,
      },
      logging: wrapLogging('[SessionService.verifyLoginOTP] Get account info'),
    });

    if (!account) {
      throw error({ httpCode: 404, messagePath: 'auth.login.accountNotFound' });
    }

    const accountData = { id: account.id, userId: account.userId, rol: account.rol };
    const responseTokens = await this.createTokens(accountData, fingerprint, device);

    if (responseTokens.isSafeMode) {
      const createdToken = await this.tokensService.createToken(
        account.id,
        generateSecureToken(),
        'secure_device',
        dayjs().add(1, 'day').toDate()
      );

      if (createdToken) responseTokens.secureToken = createdToken.token;
    }

    return responseTokens;
  }

  async refreshTokens(accountId, currentJti, fingerprint, device) {
    const currentAccess = await this.accessesService.getListAccesses({
      limit: 1,
      page: 1,
      active: true,
      accountId,
      jti: currentJti,
      notBefore: dayjs().valueOf(),
    });

    if (currentAccess.results.length === 0) {
      throw error({ httpCode: 401, messagePath: 'auth.refreshToken.sessionExpired' });
    }

    const access = currentAccess.results[0];

    const account = await this.models.usrAccounts.findOne({
      attributes: ['id', 'userId'],
      where: { id: accountId },
      include: [
        {
          model: this.models.configRoles,
          as: 'rol',
          attributes: ['id', 'name'],
          required: true,
        },
        {
          model: this.models.usrCredentials,
          as: 'credentials',
          attributes: ['credentialValue'],
          where: {
            credentialType: 'internal_code',
            verifiedAt: { [Op.not]: null },
          },
          required: true,
        },
      ],
      logging: wrapLogging('[SessionService.refreshTokens] Get account info'),
    });

    if (!account) {
      throw error({ httpCode: 401, messagePath: 'auth.refreshToken.accountNotFound' });
    }

    const accountData = {
      id: account.id,
      userId: account.userId,
      rol: account.rol,
      internalCode: account.dataValues.credentials[0].dataValues.credentialValue,
    };

    const deviceRecord = await this.devicesService.registeredDevice(
      accountId,
      fingerprint,
      device.type || 'desktop',
      device.browser,
      device.os
    );

    if (!deviceRecord) {
      throw error({ httpCode: 401, messagePath: 'auth.refreshToken.deviceNotFound' });
    }

    const isSafeMode = access.isSafeMode || !deviceRecord.isTrusted;

    const newAccessToken = this.createAccessToken(accountData, isSafeMode);
    const newRefreshToken = this.createRefreshToken(accountData, {
      fingerprint: deviceRecord.fingerprint,
      name: deviceRecord.name,
      browser: deviceRecord.browser,
      os: deviceRecord.os,
    });

    const payloadRefreshToken = this.validRefreshToken(newRefreshToken, accountData);

    if (!payloadRefreshToken.jti) {
      throw error({ httpCode: 500, messagePath: 'auth.refreshToken.tokenGenerationFailed' });
    }

    await this.accessesService.updateAccess(access.id, {
      idToken: payloadRefreshToken.jti,
      expiresAt: dayjs(payloadRefreshToken.exp * 1000).valueOf(),
      lastActivityAt: dayjs().valueOf(),
    });

    await this.devicesService.updateDevice(deviceRecord.id, { lastUsedAt: dayjs().valueOf() });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
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
    account = JSON.parse(JSON.stringify(account));
    const managedDevice = await this.manageDevice(account.id, fingerprint, device);

    const isSafeMode = !managedDevice.isTrusted;

    const credentialCode = await this.models.usrCredentials.findOne({
      attributes: ['credentialValue'],
      where: { accountId: account.id, credentialType: 'internal_code', verifiedAt: { [Op.not]: null } },
      raw: true,
    });

    account.internalCode = credentialCode.credentialValue;

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
      notBefore: dayjs().valueOf(),
    });

    if (pagination.total === 0) {
      await this.accessesService.createAccess(
        account.id,
        managedDevice.id,
        payloadRefreshToken.jti,
        dayjs(payloadRefreshToken.exp * 1000).valueOf(),
        { isSafeMode }
      );
    } else {
      await this.accessesService.updateAccess(results[0].id, {
        accountId: account.id,
        deviceId: managedDevice.id,
        idToken: payloadRefreshToken.jti,
        expiresAt: dayjs(payloadRefreshToken.exp * 1000).valueOf(),
        isSafeMode,
      });
    }

    return { accountId: account.id, isSafeMode, accessToken, refreshToken };
  }

  createAccessToken(account, isSafeMode) {
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
    const lastUsedAt = dayjs().valueOf();

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
