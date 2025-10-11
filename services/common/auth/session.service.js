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
const sequelize = require('../../../config/database/connection');
const config = require('../../../config/env');
const { wrapLogging } = require('../../../helpers/debug.helper');
const { error } = require('../../../helpers/response.helper');
const { createJWT, verifyJWT } = require('../../../helpers/security.helper');

// =============================================================================
// MODELS
// =============================================================================
const { usrAccounts, configRoles } = sequelize.models;

class SessionService {
  static async login(credential, password, fingerprint, device) {
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
      include: {
        model: configRoles,
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

    return await SessionService.createTokens(account, fingerprint, device);
  }

  static async createTokens(account, fingerprint, device) {
    const managedDevice = await SessionService.manageDevice(account.id, fingerprint, device);

    const isSafeMode = !managedDevice.isTrusted;

    const accessToken = SessionService.createAccessToken(account, isSafeMode);
    const refreshToken = SessionService.createRefreshToken(account, managedDevice);

    const payloadRefreshToken = SessionService.validRefreshToken(refreshToken, account);
    if (!payloadRefreshToken.jti) throw error({ httpCode: 401, messagePath: 'auth.login.invalidCredentials' });

    const { total, results } = await AccessServices.getListAccesses({
      limit: 5,
      page: 1,
      active: true,
      accountId: account.id,
      deviceId: managedDevice.id,
    });

    if (total === 0) {
      await AccessServices.createAccess(
        account.id,
        managedDevice.id,
        payloadRefreshToken.jti,
        moment(payloadRefreshToken.exp * 1000).valueOf(),
        { isSafeMode }
      );
    } else {
      await AccessServices.updateAccess(results[0].id, {
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
  static createAccessToken(account, isSafeMode) {
    const payload = {
      accountId: account.id,
      internalCode: account.internalCode,
      email: account.email,
      isSafeMode,
      role: account.role,
    };

    if (account.userId) payload.userId = account.userId;
    if (account.employeeId) payload.employeeId = account.employeeId;

    return createJWT(payload, config.jwt.accessToken.secret, {
      subject: 'acces_token_' + account.internalCode,
      expiresIn: config.jwt.accessToken.expiration,
    });
  }

  static createRefreshToken(account, device) {
    const payload = {
      accountId: account.id,
      internalCode: account.internalCode,
      device: { fingerprint: device.fingerprint, name: device.name, browser: device.browser, os: device.os },
    };

    return createJWT(payload, config.jwt.refreshToken.secret, {
      subject: 'refresh_token_' + account.internalCode,
      expiresIn: config.jwt.refreshToken.expiration,
    });
  }

  static validRefreshToken(refreshToken, account) {
    const payload = verifyJWT(refreshToken, config.jwt.refreshToken.secret, {
      subject: 'refresh_token_' + account.internalCode,
    });

    return payload;
  }

  // ================================ DEVICE ================================ //
  static async manageDevice(accountId, fingerprint, { deviceType, userAgent, browser, os, ip }) {
    const lastUsedAt = moment().valueOf();

    const existingDevice = await DeviceServices.registeredDevice(accountId, fingerprint, deviceType, browser, os);

    if (!existingDevice) {
      return await DeviceServices.createDevice(accountId, fingerprint, {
        name: userAgent,
        type: deviceType,
        browser,
        os,
        lastIp: ip,
        lastUsedAt,
      });
    }

    return await DeviceServices.updateDevice(existingDevice.id, { name: userAgent, lastIp: ip, lastUsedAt });
  }
}

module.exports = SessionService;
