const moment = require('moment');

const i18n = require('../../config/i18n');
const ContextHelper = require('../../helpers/context.helper');
const { initializeConnection } = require('../../config/database/connection');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');

const patternCache = new Map();

const normalizePath = (p) => {
  if (!p) return '/';
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);

  return p;
};

const compilePattern = (pattern) => {
  if (patternCache.has(pattern)) return patternCache.get(pattern);

  // Split into segments and build regex parts
  const segments = pattern.split('/').filter(Boolean);
  const paramNames = [];

  const regexParts = segments.map((seg) => {
    if (seg.startsWith(':')) {
      paramNames.push(seg.slice(1));
      return '([^/]+)'; // generic segment capture (no type enforcement here)
    }

    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  const regexString = '^/' + regexParts.join('/') + '$';
  const regex = new RegExp(regexString);

  const compiled = { regex, paramNames, rawPattern: pattern };
  patternCache.set(pattern, compiled);

  return compiled;
};

const setEnvironment = (environment) => async (_, __, next) => {
  ContextHelper.run({ environment }, () => {
    next();
  });
};

const setHost = async (req, _, next) => {
  const fullHost = req.protocol + '://' + req.get('host');

  try {
    const sequelize = await initializeConnection();
    const { configHosts } = sequelize.models;

    let host = await configHosts.findOne({ attributes: ['id', 'url'], where: { url: fullHost }, raw: true });

    if (!host) {
      perror('An attempt was made to make a request from an unknown host', {
        host: fullHost,
        ip: req.ip,
        timestamp: moment().format(
          'dddd, DD [' + i18n.__('common.of') + '] MMMM [' + i18n.__('common.of') + '] YYYY, HH:mm:ss.SSS Z'
        ),
      });

      throw error({ httpCode: 401, messagePath: 'errors.unauthorized' });
    }

    ContextHelper.set('host', host);

    return next();
  } catch (error) {
    return next(error);
  }
};

const specificityScore = (pattern) => {
  const segments = pattern.split('/').filter(Boolean);
  let staticCount = 0;
  let paramCount = 0;

  for (const s of segments) {
    if (s.startsWith(':')) paramCount++;
    else staticCount++;
  }

  return { staticCount, paramCount, length: pattern.length };
};

const setPage = async (req, _, next) => {
  const headerPage = JSON.parse(req.headers['x-path']);

  try {
    const sequelize = await initializeConnection();
    const { configPages } = sequelize.models;

    const host = ContextHelper.get('host');

    let page = await configPages.findOne({
      attributes: ['id', 'name', 'path', 'level'],
      where: { hostId: host.id, name: headerPage.name, path: headerPage.path },
      raw: true,
    });

    if (!page) {
      page = await configPages.create({
        hostId: host.id,
        name: headerPage.name,
        path: headerPage.path,
        description: headerPage.description,
        level: headerPage.level,
        requiresAuthorization: headerPage.requiresAuthorization,
        hasSensitiveInformation: headerPage.hasSensitiveInformation,
      });

      page = JSON.parse(JSON.stringify(page));
    }

    ContextHelper.set('page', page);

    return next();
  } catch (error) {
    return next(error);
  }
};

const setEndpoint = async (req, _, next) => {
  const method = req.method.toLowerCase();
  const endpointRaw = req.originalUrl.split('?')[0];
  const endpoint = normalizePath(endpointRaw);
  const parts = endpoint.split('/');

  const platform = parts[2];
  const version = parts[3];
  const group = parts[4];
  const path = '/' + parts.slice(5).join('/');

  try {
    const sequelize = await initializeConnection();
    const { configEndpoints } = sequelize.models;

    // Fetch candidates filtered by metadata to reduce comparisons
    const endpoints = await configEndpoints.findAll({
      attributes: {
        exclude: ['requiresAuthorization', 'hasSensitiveInformation', 'createdAt', 'updatedAt', 'deletedAt'],
      },
      where: { method, platform, version, endpointGroup: group },
      raw: true,
      logging: console.log,
    });

    if (!endpoints || endpoints.length === 0) {
      perror('An attempt was made to make a request to an unknown endpoint', {
        endpoint: endpointRaw,
        ip: req.ip,
        timestamp: moment().format(
          'dddd, DD [' + i18n.__('common.of') + '] MMMM [' + i18n.__('common.of') + '] YYYY, HH:mm:ss.SSS Z'
        ),
      });

      throw error({ httpCode: 404, messagePath: 'errors.notFound' });
    }

    // Build candidate list with compiled patterns and specificity metadata
    const candidates = endpoints
      .map((ep) => {
        // adapt this line to the actual column name in your DB that stores the pattern
        const pattern = ep.path;
        if (!pattern) return null;

        const compiled = compilePattern(pattern);
        const spec = specificityScore(pattern);

        return { db: ep, pattern, compiled, spec };
      })
      .filter(Boolean);

    // Sort by specificity:
    // 1) more static segments (desc)
    // 2) fewer params (asc)
    // 3) longer pattern (desc)
    candidates.sort((a, b) => {
      if (b.spec.staticCount !== a.spec.staticCount) return b.spec.staticCount - a.spec.staticCount;
      if (a.spec.paramCount !== b.spec.paramCount) return a.spec.paramCount - b.spec.paramCount;
      return b.spec.length - a.spec.length;
    });

    // Try each candidate in order and pick the first match
    let matched = null;
    let params = {};

    for (const c of candidates) {
      const { regex, paramNames } = c.compiled;
      const m = regex.exec(path);

      if (m) {
        params = {};

        for (let i = 0; i < paramNames.length; i++) params[paramNames[i]] = m[i + 1];

        matched = { fullPath: endpointRaw, ...c.db };
        break; // first (most specific) match wins
      }
    }

    ContextHelper.set('endpoint', matched);

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { setEnvironment, setHost, setPage, setEndpoint };
