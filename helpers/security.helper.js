// =============================================================================
// SECURITY UTILITIES - Authentication, Rate Limiting & Threat Monitoring
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Comprehensive security utility module providing authentication, authorization,
//   rate limiting, and threat monitoring capabilities
// - Handles password hashing/verification using bcrypt
// - JWT token generation and verification with secure defaults
// - Redis-based rate limiting for general API endpoints and login attempts
// - Security event logging and monitoring system
// - IP reputation management and automatic blocking
// - Input sanitization for logs and HTML content
//
// ARCHITECTURAL DECISIONS:
// - Redis-based rate limiting for distributed consistency across multiple instances
// - Fail-open design for rate limiting to maintain availability during Redis outages
// - Modular design allowing independent use of security components
// - Comprehensive error handling with Boom HTTP error objects for API consistency
// - Configurable security parameters through centralized configuration
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - In-memory rate limiting: Rejected due to lack of cross-instance consistency
// - Database-based logging: Rejected due to performance impact under high load
// - JWT blacklisting: Considered but implemented via short token expiration instead
// - IP blocking at network layer: Rejected in favor of application-layer blocking
//   for flexibility and easier management
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for most operations (Redis lookups, cryptographic operations)
// - Space complexity: O(n) for security event storage, limited to 1000 most recent events
// - Redis latency is primary bottleneck - recommends low-latency Redis connection
// - bcrypt hashing: Intentionally CPU-intensive (10-12 rounds recommended)
//
// SECURITY CONSIDERATIONS:
// - Uses cryptographically secure random number generation for tokens
// - Implements automatic IP blocking based on threat severity and frequency
// - Sanitizes all log outputs to prevent log injection attacks
// - Validates JWT algorithms to prevent algorithm confusion attacks
// - Rate limiting protects against brute-force and DDoS attacks
//
// USAGE EXAMPLES:
// - Password hashing/verification for user authentication
// - JWT-based session management for API authentication
// - Rate limiting on API endpoints and login attempts
// - Security monitoring and threat detection
// - IP reputation management
//
// MAINTENANCE & TROUBLESHOOTING:
// - Monitor Redis connection for rate limiting and security event storage
// - Regularly review security event logs for threat patterns
// - Adjust rate limiting thresholds based on actual traffic patterns
// - Rotate JWT secrets according to security policy
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 14+ (uses ES6+ features)
// - Redis 5+ for rate limiting and security event storage
// - Compatible with Express.js, Hapi, and other Node.js frameworks
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto'); // Cryptographically secure random number generation

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const bcrypt = require('bcrypt'); // Password hashing and verification
const Boom = require('@hapi/boom'); // HTTP-friendly error objects
const jwt = require('jsonwebtoken'); // JWT token generation and verification
const moment = require('moment'); // Date manipulation and formatting
const sanitize = require('sanitize-html'); // HTML input sanitization
const { RateLimiterRedis } = require('rate-limiter-flexible'); // Redis-based rate limiting

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const cacheHelper = require('./cache.helper'); // Redis client wrapper
const config = require('../config/env'); // Application configuration
const i18n = require('../config/i18n'); // Internationalization support
const { THREAT_LEVELS, SECURITY_CONFIG } = require('./constants.helper'); // Security constants

// =============================================================================
// RATE LIMITER INSTANCES (Redis-based)
// =============================================================================
const rateLimiters = {
  general: new RateLimiterRedis({
    storeClient: cacheHelper.client,
    keyPrefix: 'rate_limit',
    points: SECURITY_CONFIG.RATE_LIMIT.DEFAULT_MAX_REQUESTS,
    duration: SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW / 1000,
  }),
  strict: new RateLimiterRedis({
    storeClient: cacheHelper.client,
    keyPrefix: 'strict_rate_limit',
    points: SECURITY_CONFIG.RATE_LIMIT.STRICT_MAX_REQUESTS,
    duration: SECURITY_CONFIG.RATE_LIMIT.STRICT_WINDOW / 1000,
  }),
  login: new RateLimiterRedis({
    storeClient: cacheHelper.client,
    keyPrefix: 'login_rate_limit',
    points: 5, // Maximum of 5 login attempts
    duration: 15 * 60, // 15-minute window
  }),
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a cryptographically secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} Hexadecimal string representation of random bytes
 * @throws {Error} If random bytes generation fails
 * @complexity Time: O(1), Space: O(1)
 * @example
 * const token = generateSecureToken(32);
 * // Returns: 'a1b2c3d4e5f6...'
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Gets current timestamp in milliseconds since Unix epoch
 * @returns {number} Current timestamp
 * @complexity Time: O(1), Space: O(1)
 */
const getCurrentTimestamp = () => moment().valueOf();

/**
 * Sanitizes log data by removing control characters and truncating strings
 * @param {string|object} data - Data to sanitize
 * @returns {string|object} Sanitized data
 * @description Prevents log injection attacks and ensures log consistency
 */
const sanitizeLogData = (data) => {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t]/g, ' ').substring(0, 500);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized = {};

    Object.entries(data).forEach(([key, value]) => {
      sanitized[key] = sanitizeLogData(value);
    });

    return sanitized;
  }

  return data;
};

/**
 * Sanitizes HTML input to prevent XSS attacks
 * @param {string} html - HTML input to sanitize
 * @param {object} options - Custom sanitization options
 * @returns {string} Sanitized HTML
 * @see {@link https://www.npmjs.com/package/sanitize-html} for options documentation
 */
const sanitizeHTML = (html, options = {}) => {
  const defaultOptions = {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: {
      '*': ['class', 'style'],
    },
    allowedIframeHostnames: [],
    disallowedTagsMode: 'discard',
  };

  return sanitize(html, { ...defaultOptions, ...options });
};

// =============================================================================
// PASSWORD SECURITY
// =============================================================================

/**
 * Hashes password using bcrypt with configurable salt rounds
 * @param {string} password - Plain text password to hash
 * @param {number} saltRounds - Number of bcrypt salt rounds (default: from config)
 * @returns {Promise<string>} Resolves with hashed password
 * @throws {Error} If hashing fails
 * @complexity Time: O(2^saltRounds), Space: O(1)
 */
const hashPassword = async (password, saltRounds = SECURITY_CONFIG.PASSWORD_POLICY.SALT) => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verifies password against bcrypt hash
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - bcrypt hash to compare against
 * @returns {Promise<boolean>} Resolves with password match result
 * @complexity Time: O(1), Space: O(1)
 */
const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Checks rate limit for a given identifier
 * @param {string} identifier - Rate limit key (typically IP address or user ID)
 * @param {object} options - Configuration options
 * @param {boolean} options.strict - Use strict rate limits
 * @param {string} options.keyPrefix - Custom key prefix
 * @returns {Promise<object>} Rate limit status with remaining points and reset time
 * @description Fails open - allows requests if rate limiting service is unavailable
 */
const checkRateLimit = async (identifier, options = {}) => {
  try {
    const limiter = options.strict ? rateLimiters.strict : rateLimiters.general;
    const key = options.keyPrefix ? `${options.keyPrefix}:${identifier}` : identifier;

    try {
      const res = await limiter.consume(key);
      return {
        allowed: true,
        remaining: res.remainingPoints,
        resetTime: moment().add(res.msBeforeNext, 'ms').toISOString(),
        retryAfter: 0,
      };
    } catch (res) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: moment().add(res.msBeforeNext, 'ms').toISOString(),
        retryAfter: Math.ceil(res.msBeforeNext / 1000),
      };
    }
  } catch (_) {
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: 0,
      resetTime: moment().toISOString(),
      retryAfter: 0,
    };
  }
};

/**
 * Tracks login attempts and implements account lockout
 * @param {string} identifier - Login identifier (typically username or email)
 * @param {boolean} success - Whether login attempt was successful
 * @returns {Promise<object>} Login attempt status with lockout information
 */
const trackLoginAttempt = async (identifier, success = false) => {
  try {
    const key = `login:${identifier}`;

    if (success) {
      // Reset on successful login
      await rateLimiters.login.delete(key);
      return {
        allowed: true,
        attemptsRemaining: 5,
        lockoutUntil: null,
        message: 'Login successful',
      };
    }

    try {
      const res = await rateLimiters.login.consume(key);
      return {
        allowed: true,
        attemptsRemaining: res.remainingPoints,
        lockoutUntil: null,
        message: 'Invalid credentials',
      };
    } catch (res) {
      return {
        allowed: false,
        attemptsRemaining: 0,
        lockoutUntil: moment().add(res.msBeforeNext, 'ms').toISOString(),
        message: 'Account temporarily locked',
      };
    }
  } catch (_) {
    return {
      allowed: true,
      attemptsRemaining: 5,
      lockoutUntil: null,
      message: 'Login tracking unavailable',
    };
  }
};

// =============================================================================
// JWT FUNCTIONS
// =============================================================================

/**
 * Creates signed JWT token with secure defaults
 * @param {object} payload - Token payload data
 * @param {string} secret - JWT signing secret
 * @param {object} options - JWT signing options
 * @returns {string} Signed JWT token
 * @throws {Error} If token signing fails
 */
const createJWT = (payload, secret, options = {}) => {
  const defaultOptions = {
    algorithm: config.jwt.algorithm,
    expiresIn: config.jwt.expiresIn,
    notBefore: '0s',
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    jwtid: crypto.randomBytes(16).toString('hex'), // Secure random JWT ID
  };

  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
};

/**
 * Verifies JWT token and returns decoded payload
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT verification secret
 * @param {object} options - Verification options
 * @param {number} customHttpError - Custom HTTP error code
 * @returns {object} Decoded token payload
 * @throws {Boom} HTTP error with appropriate status code and message
 */
const verifyJWT = (token, secret, options = {}, customHttpError = 401) => {
  const defaultOptions = {
    algorithms: [config.jwt.algorithm],
    clockTolerance: 60,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  };

  try {
    return jwt.verify(token, secret, { ...defaultOptions, ...options });
  } catch (error) {
    switch (error.name) {
      case 'JsonWebTokenError':
        throw Boom.create(customHttpError, i18n.__('error.invalid_token'), {
          scheme: 'Bearer',
          errorType: 'invalid_token',
        });
      case 'TokenExpiredError':
        throw Boom.create(customHttpError, i18n.__('error.expired_token'), {
          scheme: 'Bearer',
          errorType: 'expired_token',
          expiredAt: error.expiredAt,
        });
      case 'NotBeforeError':
        throw Boom.create(customHttpError, i18n.__('error.token_not_active'), {
          scheme: 'Bearer',
          errorType: 'token_not_active',
          date: error.date,
        });
      default:
        throw Boom.internal(i18n.__('error.token_verification_failed'), {
          originalError: error.message,
          errorType: 'verification_failed',
        });
    }
  }
};

// =============================================================================
// SECURITY MONITORING (Redis-based)
// =============================================================================

/**
 * Logs security event to Redis for monitoring and analysis
 * @param {string} event - Event type identifier
 * @param {object} details - Event details and metadata
 * @param {string} level - Threat level from THREAT_LEVELS constants
 * @returns {Promise<string|null>} Event ID if successful, null otherwise
 */
const logSecurityEvent = async (event, details = {}, level = THREAT_LEVELS.LOW) => {
  try {
    const eventId = generateSecureToken(16);
    const securityEvent = {
      id: eventId,
      event,
      level,
      timestamp: getCurrentTimestamp(),
      ipAddress: details.ipAddress || 'unknown',
      userId: details.userId || 'unknown',
      sessionId: details.sessionId || 'unknown',
      userAgent: details.userAgent || 'unknown',
      details: sanitizeLogData(details),
    };

    // Store event in Redis with 24h TTL
    await cacheHelper.set(`security_event:${eventId}`, securityEvent, 24 * 60 * 60);

    // Add to event list for monitoring (keep last 1000 events)
    await cacheHelper.lPush('security_events', eventId);
    await cacheHelper.lTrim('security_events', 0, 999);

    return eventId;
  } catch (error) {
    console.error('Failed to log security event:', error);
    return null;
  }
};

/**
 * Retrieves security events with optional filtering
 * @param {object} filters - Filter criteria
 * @param {number} filters.limit - Maximum number of events to return
 * @param {string} filters.level - Filter by threat level
 * @param {string} filters.eventType - Filter by event type
 * @returns {Promise<array>} Array of security events sorted by timestamp (newest first)
 */
const getSecurityEvents = async (filters = {}) => {
  try {
    const { limit = 100, level = null, eventType = null } = filters;

    const eventIds = await cacheHelper.lRange('security_events', 0, limit - 1);
    const events = [];

    for (const eventId of eventIds) {
      const event = await cacheHelper.get(`security_event:${eventId}`);
      if (event) {
        // Apply filters
        if ((!level || event.level === level) && (!eventType || event.event.includes(eventType.toUpperCase()))) {
          events.push(event);
        }
      }
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to get security events:', error);
    return [];
  }
};

// =============================================================================
// IP SECURITY
// =============================================================================

/**
 * Marks IP address as suspicious and implements automatic blocking
 * @param {string} ipAddress - IP address to mark
 * @param {string} reason - Reason for marking
 * @param {string} severity - Threat severity level
 * @returns {Promise<boolean>} Success status
 */
const markSuspiciousIP = async (ipAddress, reason, severity = THREAT_LEVELS.MEDIUM) => {
  try {
    const key = `suspicious_ip:${ipAddress}`;
    const now = getCurrentTimestamp();

    let ipData = (await cacheHelper.get(key)) || {
      incidents: [],
      blockedUntil: null,
      totalIncidents: 0,
    };

    ipData.incidents.push({
      timestamp: now,
      reason,
      severity,
    });
    ipData.totalIncidents++;

    // Auto-block based on severity and frequency
    if (severity === THREAT_LEVELS.CRITICAL || ipData.totalIncidents >= 10) {
      ipData.blockedUntil = now + 24 * 60 * 60 * 1000; // 24 hours
    } else if (severity === THREAT_LEVELS.HIGH || ipData.totalIncidents >= 5) {
      ipData.blockedUntil = now + 60 * 60 * 1000; // 1 hour
    }

    // Store with appropriate TTL
    const ttl = ipData.blockedUntil ? Math.ceil((ipData.blockedUntil - now) / 1000) : 7 * 24 * 60 * 60; // 7 days if not blocked

    await cacheHelper.set(key, ipData, ttl);

    return true;
  } catch (error) {
    console.error('Failed to mark suspicious IP:', error);
    return false;
  }
};

/**
 * Checks current status of IP address
 * @param {string} ipAddress - IP address to check
 * @returns {Promise<object>} IP status information
 */
const checkIPStatus = async (ipAddress) => {
  try {
    const ipData = await cacheHelper.get(`suspicious_ip:${ipAddress}`);

    if (!ipData) {
      return {
        isBlocked: false,
        isSuspicious: false,
        blockedUntil: null,
        incidentCount: 0,
      };
    }

    const now = getCurrentTimestamp();
    const isBlocked = ipData.blockedUntil && now < ipData.blockedUntil;

    return {
      isBlocked,
      isSuspicious: ipData.incidents.length > 0,
      blockedUntil: ipData.blockedUntil,
      incidentCount: ipData.totalIncidents,
    };
  } catch (error) {
    console.error('Failed to check IP status:', error);
    return {
      isBlocked: false,
      isSuspicious: false,
      blockedUntil: null,
      incidentCount: 0,
    };
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Utility functions
  generateSecureToken,
  getCurrentTimestamp,
  sanitizeLogData,
  sanitizeHTML,

  // Password security
  hashPassword,
  verifyPassword,

  // Rate limiting
  checkRateLimit,
  trackLoginAttempt,

  // JWT functions
  createJWT,
  verifyJWT,

  // Security monitoring
  logSecurityEvent,
  getSecurityEvents,

  // IP security
  markSuspiciousIP,
  checkIPStatus,
};
