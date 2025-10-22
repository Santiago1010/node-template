const moment = require('moment');
const { Op } = require('sequelize');

const ContextHelper = require('../../helpers/context.helper');
const ScopeServices = require('../../services/common/configurations/scopes.services');
const { getSequelize } = require('../../config/database/connection');
const { get, buildKey } = require('../../helpers/cache.helper');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');
const { verifyJWT } = require('../../helpers/security.helper');
const { getSecret } = require('../../helpers/vault.helper');

// Cache JWT secrets to avoid repeated Vault calls
let jwtSecretsCache = null;
let secretsCacheTime = 0;
const SECRETS_CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Gets JWT secrets with caching to reduce Vault calls
 */
const getJWTSecrets = async () => {
  const now = moment().valueOf();

  if (jwtSecretsCache && now - secretsCacheTime < SECRETS_CACHE_TTL) {
    return jwtSecretsCache;
  }

  const environment = ContextHelper.get('environment');
  const secrets = await getSecret(`jwt/${environment}`);

  jwtSecretsCache = secrets;
  secretsCacheTime = now;

  return secrets;
};

const validateWebSession = async (req, _, next) => {
  try {
    // Extract and validate tokens early
    const { accessToken, refreshToken } = req.cookies;
    const fingerprint = req.headers['x-fingerprint'];

    // Early validation - fail fast
    if (!accessToken) {
      perror('No access token found', { cookies: req.cookies });
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    if (!refreshToken) {
      perror('No refresh token found', { cookies: req.cookies });
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    if (!fingerprint) {
      perror('No fingerprint found', { headers: req.headers });
      throw error({ httpCode: 401, messagePath: 'auth.session.missingFingerprint' });
    }

    // Get JWT secrets and sequelize in parallel
    const [{ refresh_token_secret, access_token_secret }, sequelize] = await Promise.all([
      getJWTSecrets(),
      getSequelize(),
    ]);

    // Verify tokens
    const refreshTokenPayload = verifyJWT(refreshToken, refresh_token_secret);

    if (!refreshTokenPayload?.internalCode) {
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidToken' });
    }

    const accessTokenPayload = verifyJWT(
      accessToken,
      access_token_secret,
      { subject: `acces_token_${refreshTokenPayload.internalCode}` },
      498
    );

    if (!accessTokenPayload?.internalCode) {
      throw error({ httpCode: 498, messagePath: 'auth.session.invalidToken' });
    }

    // Verify token matching
    if (refreshTokenPayload.internalCode !== accessTokenPayload.internalCode) {
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidToken' });
    }

    const now = moment().valueOf();
    const { usrAccounts, usrAccesses, usrDevices, configRoles, usrUsers, usrEmployees, configSecurityLevels } =
      sequelize.models;

    // Single optimized database query with all required data
    const account = await usrAccounts.findOne({
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
          include: {
            model: configSecurityLevels,
            as: 'securityLevel',
            attributes: ['id', 'slug', 'name', 'description', 'priority'],
            required: true,
          },
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

    // Verify session data in Redis
    const sessionKey = buildKey('session', account.id, fingerprint);
    const sessionData = await get(sessionKey);

    if (!sessionData) {
      perror('No session data found in redis', { sessionKey });
      throw error({ httpCode: 401, messagePath: 'auth.session.notFound' });
    }

    // Convert account to plain object once
    const accountPlain = account.toJSON();

    // Build user data object efficiently
    const userData = {
      id: 0,
      profile: accountPlain.profile,
    };

    // Parallel fetch of user and employee data if needed
    const queries = [];

    if (accountPlain.userId) {
      queries.push(
        usrUsers.findByPk(accountPlain.userId, {
          attributes: ['id', 'completeName', 'firstName', 'secondName', 'firstLastName', 'secondLastName'],
          raw: true,
        })
      );
    } else {
      queries.push(Promise.resolve(null));
    }

    if (accountPlain.employeeId) {
      queries.push(
        usrEmployees.findByPk(accountPlain.employeeId, {
          attributes: ['id', 'document', 'completeName', 'firstName', 'secondName', 'firstLastName', 'secondLastName'],
          raw: true,
        })
      );
    } else {
      queries.push(Promise.resolve(null));
    }

    const [user, employee] = await Promise.all(queries);

    // Validate fetched data
    if (accountPlain.userId && !user) {
      perror('No user found', { userId: accountPlain.userId });
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    if (accountPlain.employeeId && !employee) {
      perror('No employee found', { employeeId: accountPlain.employeeId });
      throw error({ httpCode: 401, messagePath: 'auth.session.invalidSession' });
    }

    // Merge user/employee data efficiently
    if (user) Object.assign(userData, user);
    if (employee) Object.assign(userData, employee);

    // Clean up account data
    const cleanAccount = {
      ...accountPlain,
      profile: undefined,
      profileInt: undefined,
      userId: undefined,
      employeeId: undefined,
    };

    // Fetch scopes in parallel with user data construction
    const scopesService = new ScopeServices(sequelize);
    const scopes = await scopesService.getAllScopesOfAnAccount(accountPlain.id, accountPlain.role.id);

    // Build final user object
    req.user = {
      ...userData,
      internalCode: cleanAccount.internalCode,
      securityLevel: cleanAccount.role.securityLevel.priority,
      account: cleanAccount,
      scopes,
      device: refreshTokenPayload.device,
      jti: refreshTokenPayload.jti,
    };

    delete req.user.account.internalCode;
    delete req.user.account.role.securityLevel.priority;

    ContextHelper.set('user', req.user);

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { validateWebSession };
