// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const bcrypt = require('bcrypt');
const moment = require('moment');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const AccessServices = require('../users/accesses.services');
const DeviceServices = require('../users/devices.services');
const config = require('../../../config/env');
const ContextHelper = require('../../../helpers/context.helper');
const { getSequelize } = require('../../../config/database/connection');
const { wrapLogging } = require('../../../helpers/debug.helper');
const { error } = require('../../../helpers/response.helper');
const { createJWT, verifyJWT } = require('../../../helpers/security.helper');
const { getSecret } = require('../../../helpers/vault.helper');

class SessionService {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    this.accessTokenSecret = null;
    this.refreshTokenSecret = null;

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

  async login(credential, password, fingerprint, device) {
    const account = await this.models.usrAccounts.findOne({
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
      include: {
        model: this.models.configRoles,
        as: 'role',
        attributes: ['id', 'name'],
        required: true,
      },
      logging: wrapLogging('[SessionService.login] Get account by credential'),
    });

    if (!account) throw error({ httpCode: 404, messagePath: 'auth.login.invalidCredentials' });

    if (!account.emailConfirmedAt && !account.mobileNumberConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.invalidCredentials' });
    }

    if (credential === account.email && !account.emailConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.invalidCredentials' });
    }

    if (credential === account.mobileNumber && !account.mobileNumberConfirmedAt) {
      throw error({ httpCode: 401, messagePath: 'auth.login.invalidCredentials' });
    }

    const validPassword = await bcrypt.compare(password, account.password);
    account.password = undefined;
    if (!validPassword) throw error({ httpCode: 401, messagePath: 'auth.login.invalidCredentials' });

    return await this.createTokens(account, fingerprint, device);
  }

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

  // =============================== TOKENS ================================ //
  createAccessToken(account, isSafeMode) {
    const payload = { internalCode: account.internalCode, isSafeMode, role: account.role.name };

    if (account.userId) payload.profile = 'user';
    if (account.employeeId) payload.profile = 'employee';

    return createJWT(payload, this.accessTokenSecret, {
      subject: 'acces_token_' + account.internalCode,
      expiresIn: config.jwt.accessToken.expiration,
    });
  }

  createRefreshToken(account, device) {
    const payload = {
      internalCode: account.internalCode,
      device: { fingerprint: device.fingerprint, name: device.name, browser: device.browser, os: device.os },
    };

    return createJWT(payload, this.refreshTokenSecret, {
      subject: 'refresh_token_' + account.internalCode,
      expiresIn: config.jwt.refreshToken.expiration,
    });
  }

  validRefreshToken(refreshToken, account) {
    const payload = verifyJWT(refreshToken, this.refreshTokenSecret, {
      subject: 'refresh_token_' + account.internalCode,
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
