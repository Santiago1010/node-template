const ContextHelper = require('../../helpers/context.helper');
const { get, buildKey } = require('../../helpers/cache.helper');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');
const { verifyJWT } = require('../../helpers/security.helper');
const { getSecret } = require('../../helpers/vault.helper');

const validateWebSession = async (req, _, next) => {
  try {
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

    const { access_token_secret } = await getSecret('jwt/' + ContextHelper.get('environment'));

    const payload = verifyJWT(
      accessToken,
      access_token_secret,
      { subject: 'acces_token_' + (req.params.internalCode || '') },
      498
    );

    if (!payload || !payload.accountId) throw error({ httpCode: 498, messagePath: 'auth.session.invalidToken' });

    const sessionKey = buildKey('session', payload.accountId, fingerprint);
    const sessionData = await get(sessionKey);

    if (!sessionData) throw error({ httpCode: 401, messagePath: 'auth.session.notFound' });

    req.user = {
      accountId: payload.accountId,
      internalCode: payload.internalCode,
      email: payload.email,
      userId: payload.userId,
      employeeId: payload.employeeId,
      role: payload.role,
      isSafeMode: payload.isSafeMode,
    };

    req.session = sessionData;
    req.fingerprint = fingerprint;

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { validateWebSession };
