const ContextHelper = require('../../helpers/context.helper');
const { get, buildKey } = require('../../helpers/cache.helper');
const { error } = require('../../helpers/response.helper');
const { verifyJWT } = require('../../helpers/security.helper');
const { getSecret } = require('../../helpers/vault.helper');

const validateWebSession = async (req, _, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) throw error({ httpCode: 401, messagePath: 'auth.session.missingToken' });

    const fingerprint = req.body.fingerprint || req.headers['x-fingerprint'];

    if (!fingerprint) {
      throw error({
        httpCode: 401,
        messagePath: 'auth.session.missingFingerprint',
      });
    }
    const { access_token_secret } = await getSecret('jwt/' + ContextHelper.get('environment'));

    const payload = verifyJWT(
      accessToken,
      access_token_secret,
      { subject: 'acces_token_' + (req.params.internalCode || '') },
      498
    );

    if (!payload || !payload.accountId) {
      throw error({
        httpCode: 498,
        messagePath: 'auth.session.invalidToken',
      });
    }

    const sessionKey = buildKey('session', payload.accountId, fingerprint);
    const sessionData = await get(sessionKey);

    if (!sessionData) {
      throw error({ httpCode: 401, messagePath: 'auth.session.notFound' });
    }

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

    next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { validateWebSession };
