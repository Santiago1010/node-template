// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const bcrypt = require('bcrypt');
const moment = require('moment');
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ScopeServices = require('../configurations/scopes.services');
const AccessServices = require('../users/accesses.services');
const DeviceServices = require('../users/devices.services');
const sequelize = require('../../../config/database/connection');
const config = require('../../../config/env');
const { wrapLogging } = require('../../../helpers/debug.helper');
const { error } = require('../../../helpers/response.helper');
const { createJWT, verifyJWT } = require('../../../helpers/security.helper');
const { generateUUID } = require('../../../utils/utilities.util');

// =============================================================================
// MODELS
// =============================================================================
const { usrAccounts, configRoles } = sequelize.models;

class SessionService {
  static async login(credential, password, device) {
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

    return await SessionService.createTokens(account, device);
  }

  static async createTokens(account, device) {
    const managedDevice = await SessionService.manageDevice(account.id, device);
    const scopes = await ScopeServices.getAllScopesOfAnAccount(account.id, account.role.id);

    const isSafeMode = !managedDevice.isTrusted;

    const accessToken = SessionService.createAccessToken(account, isSafeMode, scopes);
    const refreshToken = SessionService.createRefreshToken(account, managedDevice);

    const { jti } = SessionService.validRefreshToken(refreshToken, account);
    if (!jti) throw error({ httpCode: 401, messagePath: 'auth.login.invalidRefreshToken' });

    await AccessServices.createAccess(account.id, managedDevice.id, jti, { isSafeMode });

    return { isSafeMode, scopes, accessToken, refreshToken };
  }

  // =============================== TOKENS ================================ //
  static createAccessToken(account, isSafeMode, scopes) {
    const payload = {
      accountId: account.id,
      internalCode: account.internalCode,
      email: account.email,
      isSafeMode,
      role: account.role,
      scopes,
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
  static async manageDevice(accountId, { deviceType, userAgent, browser, os, ip }) {
    const lastUsedAt = moment().valueOf();

    const existingDevice = await DeviceServices.registeredDevice(accountId, deviceType, browser, os);

    if (!existingDevice) {
      return await DeviceServices.createDevice(accountId, generateUUID(), {
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
