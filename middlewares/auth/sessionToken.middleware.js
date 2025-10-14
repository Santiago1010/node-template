const moment = require('moment');
const { Op } = require('sequelize');

const ContextHelper = require('../../helpers/context.helper');
const { getSequelize } = require('../../config/database/connection');
const { get, buildKey } = require('../../helpers/cache.helper');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');
const { verifyJWT } = require('../../helpers/security.helper');
const { getSecret } = require('../../helpers/vault.helper');

const validateWebSession = async (req, _, next) => {
  try {
    const sequelize = await getSequelize();
    const { usrAccounts, usrAccesses, usrDevices, configRoles, usrUsers, usrEmployees } = sequelize.models;

    const { accessToken, refreshToken } = req.cookies;

    if (!accessToken) {
      perror('No access token found', { cookies: req.cookies });

      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    if (!refreshToken) {
      perror('No refresh token found', { cookies: req.cookies });

      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    const fingerprint = req.headers['x-fingerprint'];

    if (!fingerprint) {
      perror('No fingerprint found', { headers: req.headers });

      throw error({ httpCode: 401, messagePath: 'auth.session.missingFingerprint' });
    }

    const { refresh_token_secret, access_token_secret } = await getSecret('jwt/' + ContextHelper.get('environment'));

    const refreshTokenPayload = verifyJWT(refreshToken, refresh_token_secret);

    if (!refreshTokenPayload || !refreshTokenPayload.internalCode) {
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidToken' });
    }

    const accessTokenPayload = verifyJWT(
      accessToken,
      access_token_secret,
      { subject: 'acces_token_' + refreshTokenPayload.internalCode },
      498
    );

    if (!accessTokenPayload || !accessTokenPayload.internalCode) {
      throw error({ httpCode: 498, messagePath: 'auth.session.invalidToken' });
    }

    if (refreshTokenPayload.internalCode !== accessTokenPayload.internalCode) {
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidToken' });
    }

    const now = moment().valueOf();

    let account = await usrAccounts.findOne({
      attributes: {
        exclude: [
          'rolId',
          'dialCodeId',
          'recoveryEmail',
          'recoveryEmailConfirmedAt',
          'password',
          'createdAt',
          'updatedAt',
          'deletedAt',
        ],
      },
      where: { internalCode: accessTokenPayload.internalCode },
      include: [
        {
          model: configRoles,
          as: 'role',
          attributes: ['id', 'name'],
          required: true,
        },
        {
          model: usrAccesses,
          as: 'accesses',
          attributes: [],
          where: { idToken: refreshTokenPayload.jti, expiresAt: { [Op.gte]: now } },
          required: true,
          include: {
            model: usrDevices,
            as: 'device',
            attributes: [],
            where: { fingerprint, browser: refreshTokenPayload.device.browser, os: refreshTokenPayload.device.os },
            required: true,
          },
        },
      ],
      subQuery: false,
    });

    if (!account) {
      perror('No account found', { internalCode: accessTokenPayload.internalCode });

      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    const sessionKey = buildKey('session', account.id, fingerprint);
    const sessionData = await get(sessionKey);

    if (!sessionData) {
      perror('No session data found in redis', { sessionKey });

      throw error({ httpCode: 401, messagePath: 'auth.session.notFound' });
    }

    account = JSON.parse(JSON.stringify(account));
    let data = { id: 0, profile: account.profile };

    if (account.userId) {
      const user = await usrUsers.findByPk(account.userId, {
        attributes: ['id', 'completeName', 'firstName', 'secondName', 'firstLastName', 'secondLastName'],
      });

      if (!user) {
        perror('No user found', { userId: account.userId });

        throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
      }

      data = { ...data, ...JSON.parse(JSON.stringify(user)) };
    }

    if (account.employeeId) {
      const employee = await usrEmployees.findByPk(account.userId, {
        attributes: ['id', 'document', 'completeName', 'firstName', 'secondName', 'firstLastName', 'secondLastName'],
      });

      if (!employee) {
        perror('No employee found', { employeeId: account.employeeId });

        throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
      }

      data = { ...data, ...JSON.parse(JSON.stringify(employee)) };
    }

    delete account.profile;
    delete account.profileInt;
    delete account.userId;
    delete account.employeeId;

    req.user = { ...data, account };

    ContextHelper.set('user', req.user);

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { validateWebSession };
