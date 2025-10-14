const moment = require('moment');

const i18n = require('../../config/i18n');
const ContextHelper = require('../../helpers/context.helper');
const { initializeConnection } = require('../../config/database/connection');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');

/**
 * Optimized context middleware
 *
 * Performance optimizations:
 * 1. Pre-compiled regex patterns with LRU cache eviction
 * 2. Fast path normalization without regex
 * 3. Optimized endpoint matching with early exit
 * 4. Cached timestamp formatter to avoid repeated i18n calls
 * 5. Single-pass endpoint parsing
 * 6. Lazy sequelize connection (only when needed)
 */

// ============================================================================
// PATTERN CACHE WITH LRU EVICTION
// ============================================================================

const MAX_PATTERN_CACHE_SIZE = 500;
const patternCache = new Map();

const compilePattern = (pattern) => {
  if (patternCache.has(pattern)) {
    // Move to end (LRU)
    const value = patternCache.get(pattern);
    patternCache.delete(pattern);
    patternCache.set(pattern, value);
    return value;
  }

  // Split and build regex
  const segments = pattern.split('/').filter(Boolean);
  const paramNames = [];

  const regexParts = segments.map((seg) => {
    if (seg.startsWith(':')) {
      paramNames.push(seg.slice(1));
      return '([^/]+)';
    }
    // Escape special regex characters
    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });

  const regexString = '^/' + regexParts.join('/') + '$';
  const regex = new RegExp(regexString);

  const compiled = { regex, paramNames, rawPattern: pattern };

  // LRU eviction
  if (patternCache.size >= MAX_PATTERN_CACHE_SIZE) {
    const firstKey = patternCache.keys().next().value;
    patternCache.delete(firstKey);
  }

  patternCache.set(pattern, compiled);
  return compiled;
};

// ============================================================================
// FAST PATH NORMALIZATION
// ============================================================================

const normalizePath = (path) => {
  if (!path || path === '/') return '/';

  // Fast path: check last character
  const lastChar = path[path.length - 1];
  if (lastChar === '/' && path.length > 1) {
    return path.slice(0, -1);
  }

  return path;
};

// ============================================================================
// SPECIFICITY SCORING (OPTIMIZED)
// ============================================================================

const specificityScore = (pattern) => {
  let staticCount = 0;
  let paramCount = 0;
  let i = 0;

  // Single pass counting
  while (i < pattern.length) {
    if (pattern[i] === '/') {
      i++;
      if (i < pattern.length) {
        if (pattern[i] === ':') {
          paramCount++;
          // Skip to next slash
          while (i < pattern.length && pattern[i] !== '/') i++;
        } else {
          staticCount++;
          // Skip to next slash
          while (i < pattern.length && pattern[i] !== '/') i++;
        }
      }
    } else {
      i++;
    }
  }

  return { staticCount, paramCount, length: pattern.length };
};

// ============================================================================
// TIMESTAMP FORMATTER CACHE
// ============================================================================

let timestampFormat = null;

const getTimestampFormat = () => {
  if (!timestampFormat) {
    const of = i18n.__('common.of');
    timestampFormat = `dddd, DD [${of}] MMMM [${of}] YYYY, HH:mm:ss.SSS Z`;
  }
  return timestampFormat;
};

const getFormattedTimestamp = () => moment().format(getTimestampFormat());

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

const setEnvironment = (environment) => async (_, __, next) => {
  ContextHelper.run({ environment }, () => {
    next();
  });
};

const setHost = async (req, _, next) => {
  try {
    // Build host URL (protocol is typically 'http' or 'https', both 4-5 chars)
    const protocol = req.protocol;
    const host = req.get('host');
    const fullHost = `${protocol}://${host}`;

    const sequelize = await initializeConnection();
    const { configHosts } = sequelize.models;

    const hostRecord = await configHosts.findOne({
      attributes: ['id', 'url'],
      where: { url: fullHost },
      raw: true,
    });

    if (!hostRecord) {
      perror('An attempt was made to make a request from an unknown host', {
        host: fullHost,
        ip: req.ip,
        timestamp: getFormattedTimestamp(),
      });

      throw error({ httpCode: 401, messagePath: 'errors.unauthorized' });
    }

    ContextHelper.set('host', hostRecord);

    return next();
  } catch (err) {
    return next(err);
  }
};

const setPage = async (req, _, next) => {
  try {
    // Parse header once
    const headerPage = JSON.parse(req.headers['x-path']);

    const sequelize = await initializeConnection();
    const { configPages } = sequelize.models;

    const host = ContextHelper.get('host');

    let page = await configPages.findOne({
      attributes: ['id', 'name', 'path', 'level'],
      where: {
        hostId: host.id,
        name: headerPage.name,
        path: headerPage.path,
      },
      raw: true,
    });

    if (!page) {
      // Create and immediately get as plain object
      const newPage = await configPages.create({
        hostId: host.id,
        name: headerPage.name,
        path: headerPage.path,
        description: headerPage.description,
        level: headerPage.level,
        requiresAuthorization: headerPage.requiresAuthorization,
        hasSensitiveInformation: headerPage.hasSensitiveInformation,
      });

      page = newPage.get({ plain: true });
    }

    ContextHelper.set('page', page);

    return next();
  } catch (err) {
    return next(err);
  }
};

const setEndpoint = async (req, _, next) => {
  try {
    const method = req.method.toLowerCase();

    // Fast endpoint parsing - single pass
    const endpointRaw = req.originalUrl.split('?')[0];
    const endpoint = normalizePath(endpointRaw);

    // Split once and extract parts
    const parts = endpoint.split('/');

    // Validate structure (must have at least: /<api>/<platform>/<version>/<group>)
    if (parts.length < 5) {
      throw error({ httpCode: 404, messagePath: 'errors.notFound' });
    }

    const platform = parts[2];
    const version = parts[3];
    const group = parts[4];
    const path = '/' + parts.slice(5).join('/');

    const sequelize = await initializeConnection();
    const { configEndpoints } = sequelize.models;

    // Fetch candidates with optimized query
    const endpoints = await configEndpoints.findAll({
      attributes: ['id', 'path', 'method', 'platform', 'version', 'endpointGroup'],
      where: {
        method,
        platform,
        version,
        endpointGroup: group,
      },
      raw: true,
    });

    if (!endpoints || endpoints.length === 0) {
      perror('An attempt was made to make a request to an unknown endpoint', {
        endpoint: endpointRaw,
        ip: req.ip,
        timestamp: getFormattedTimestamp(),
      });

      throw error({ httpCode: 404, messagePath: 'errors.notFound' });
    }

    // Pre-process candidates with specificity
    const candidates = [];

    for (let i = 0; i < endpoints.length; i++) {
      const ep = endpoints[i];
      const pattern = ep.path;

      if (!pattern) continue;

      const compiled = compilePattern(pattern);
      const spec = specificityScore(pattern);

      candidates.push({
        db: ep,
        compiled,
        spec,
      });
    }

    // Sort by specificity (most specific first)
    candidates.sort((a, b) => {
      // More static segments wins
      if (b.spec.staticCount !== a.spec.staticCount) {
        return b.spec.staticCount - a.spec.staticCount;
      }
      // Fewer params wins
      if (a.spec.paramCount !== b.spec.paramCount) {
        return a.spec.paramCount - b.spec.paramCount;
      }
      // Longer pattern wins
      return b.spec.length - a.spec.length;
    });

    // Find first match
    let matched = null;
    let params = {};

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const { regex, paramNames } = candidate.compiled;
      const match = regex.exec(path);

      if (match) {
        // Extract params
        params = {};
        for (let j = 0; j < paramNames.length; j++) {
          params[paramNames[j]] = match[j + 1];
        }

        matched = {
          fullPath: endpointRaw,
          ...candidate.db,
        };
        break; // First match wins
      }
    }

    if (!matched) {
      throw error({ httpCode: 404, messagePath: 'errors.notFound' });
    }

    ContextHelper.set('endpoint', matched);
    ContextHelper.set('params', params);

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  setEnvironment,
  setHost,
  setPage,
  setEndpoint,
};
