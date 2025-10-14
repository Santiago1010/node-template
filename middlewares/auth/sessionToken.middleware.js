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
    const { usrAccounts, usrAccesses, usrDevices } = sequelize.models;

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

    const account = await usrAccounts.findOne({
      attributes: ['id'],
      where: { internalCode: accessTokenPayload.internalCode },
      include: {
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
      subQuery: false,
    });

    if (!account) {
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    const sessionKey = buildKey('session', account.id, fingerprint);
    const sessionData = await get(sessionKey);

    if (!sessionData) {
      perror('No session data found in redis', { sessionKey });

      throw error({ httpCode: 401, messagePath: 'auth.session.notFound' });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { validateWebSession };
