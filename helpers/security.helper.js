// =============================================================================
// SECURITY HELPER MODULE - Core Security Utilities
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Provides cryptographic operations (token generation, password hashing)
// - Implements JWT token creation and verification with secure defaults
// - Offers HTML and log data sanitization to prevent injection attacks
// - Provides Redis-based security event logging and monitoring
// - Implements IP reputation management with automatic blocking
//
// ARCHITECTURAL DECISIONS:
// - Uses bcrypt for password hashing for proven cryptographic security
// - Implements JWT with secure defaults and proper error handling
// - Uses Redis for security event storage for performance and persistence
// - Implements configurable security policies through central configuration
// - Uses modular design for testability and maintainability
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Considered Argon2 for password hashing but chose bcrypt for wider compatibility
// - Evaluated MongoDB for event storage but chose Redis for faster write performance
// - Considered external IP reputation services but chose internal implementation for control
// - Evaluated dedicated sanitization libraries but chose sanitize-html for XSS protection
//
// PERFORMANCE CHARACTERISTICS:
// - Password hashing: O(2^saltRounds) time complexity, configurable
// - JWT operations: O(1) for both creation and verification
// - Security event logging: O(1) for writes, O(n) for reads with filtering
// - IP blocking: O(1) for checks, O(1) for updates
//
// SECURITY CONSIDERATIONS:
// - Uses cryptographically secure random number generation for tokens
// - Implements proper JWT validation with algorithm enforcement
// - Sanitizes all user input to prevent injection attacks
// - Implements automatic IP blocking based on threat severity
// - Validates JWT audience and issuer to prevent token misuse
//
// USAGE EXAMPLES:
// - Password hashing/verification for user authentication
// - JWT-based session management for API authentication
// - Security monitoring for suspicious activity detection
// - Input sanitization for user-generated content
//
// MAINTENANCE & TROUBLESHOOTING:
// - Monitor Redis memory usage for security event storage
// - Regularly review and adjust security thresholds in configuration
// - Monitor JWT secret rotation schedules
// - Watch for bcrypt performance impacts during authentication peaks
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 14+ for crypto module features
// - Compatible with Redis 5+ for event storage
// - Uses bcrypt 5.x for password hashing compatibility
// - Requires JWT secret rotation every 90 days (recommended)
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto'); // Cryptographically secure random number generation

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const bcrypt = require('bcrypt'); // Password hashing and verification (v5.x)
const Boom = require('@hapi/boom'); // HTTP-friendly error objects (v9.x)
const jwt = require('jsonwebtoken'); // JWT token generation and verification (v8.x)
const moment = require('moment'); // Date manipulation and formatting (v2.x)
const sanitize = require('sanitize-html'); // HTML input sanitization (v2.x)

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const cacheHelper = require('./cache.helper'); // Redis client wrapper
const config = require('../config/env'); // Application configuration
const i18n = require('../config/i18n'); // Internationalization support
const { THREAT_LEVELS, SECURITY_CONFIG } = require('./constants.helper'); // Security constants

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a cryptographically secure random token using Node.js crypto module
 *
 * @description Uses crypto.randomBytes for secure random number generation.
 * Suitable for password reset tokens, session identifiers, and CSRF tokens.
 *
 * @param {number} [length=32] - Token length in bytes (not characters)
 * @returns {string} Hexadecimal string representation (2x length in characters)
 * @throws {Error} If random bytes generation fails (system entropy issues)
 *
 * @example
 * // Generate a 32-byte (64-character hex) token
 * const token = generateSecureToken();
 *
 * @example
 * // Generate a 16-byte token for shorter URLs
 * const shortToken = generateSecureToken(16);
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 * @see {@link crypto.randomBytes} for underlying implementation
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Gets current timestamp in milliseconds since Unix epoch
 *
 * @description Uses moment.js for consistent timestamp generation.
 * More reliable than Date.now() for cross-timezone applications.
 *
 * @returns {number} Current timestamp in milliseconds
 *
 * @example
 * const timestamp = getCurrentTimestamp();
 * // Returns: 1672531200000
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const getCurrentTimestamp = () => moment().valueOf();

/**
 * Sanitizes log data to prevent injection attacks and ensure consistency
 *
 * @description Removes control characters, truncates strings, and handles circular references.
 * Critical for security monitoring to prevent log forging attacks.
 *
 * @param {string|object} data - Data to sanitize (strings or objects)
 * @param {WeakSet} [seen=new WeakSet()] - Internal parameter for circular reference detection
 * @returns {string|object} Sanitized data safe for logging
 *
 * @example
 * // Sanitize user input
 * const cleanLog = sanitizeLogData(userInput);
 *
 * @example
 * // Sanitize complex object
 * const cleanObj = sanitizeLogData({ user: userData, meta: metadata });
 *
 * @since Version 1.2.0
 */
const sanitizeLogData = (data, seen = new WeakSet()) => {
  if (typeof data === 'string') {
    // Remove control characters and normalize whitespace
    return data
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .substring(0, 500); // Truncate to prevent log flooding
  }

  if (typeof data === 'object' && data !== null) {
    if (seen.has(data)) return '[Circular Reference]';

    seen.add(data);
    const sanitized = {};

    Object.entries(data).forEach(([key, value]) => {
      sanitized[key] = sanitizeLogData(value, seen);
    });

    return sanitized;
  }

  return data;
};

/**
 * Sanitizes HTML input to prevent XSS attacks
 *
 * @description Uses sanitize-html library with conservative defaults.
 * Configurable options allow for custom sanitization rules.
 *
 * @param {string} html - Potentially unsafe HTML input
 * @param {object} [options={}] - Custom sanitization options
 * @returns {string} Sanitized HTML safe for rendering
 * @throws {Error} If HTML parsing fails
 *
 * @example
 * // Basic sanitization
 * const cleanHtml = sanitizeHTML(userInput);
 *
 * @example
 * // Custom allowed tags
 * const customOptions = { allowedTags: ['b', 'i', 'em'] };
 * const customHtml = sanitizeHTML(userInput, customOptions);
 *
 * @since Version 1.0.0
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
 *
 * @description Implements industry-standard password hashing with cost factor.
 * The salt rounds parameter should be adjusted based on server capabilities.
 *
 * @param {string} password - Plain text password (utf-8 encoding)
 * @param {number} [saltRounds=SECURITY_CONFIG.PASSWORD_POLICY.SALT] - Cost factor (2^rounds iterations)
 * @returns {Promise<string>} Resolves with bcrypt hash string
 * @throws {Error} If hashing fails (invalid input or system error)
 *
 * @example
 * // Hash password with default cost
 * const hashed = await hashPassword('userPassword123');
 *
 * @example
 * // Higher security for sensitive accounts
 * const extraSecure = await hashPassword('password', 12);
 *
 * @complexity Time: O(2^saltRounds), Space: O(1)
 * @since Version 1.0.0
 * @see {@link https://www.npmjs.com/package/bcrypt} for implementation details
 */
const hashPassword = async (password, saltRounds = SECURITY_CONFIG.PASSWORD_POLICY.SALT) => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verifies password against bcrypt hash
 *
 * @description Uses constant-time comparison to prevent timing attacks.
 * Always returns within consistent time regardless of input to prevent
 * timing-based oracle attacks.
 *
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - bcrypt hash to compare against
 * @returns {Promise<boolean>} Resolves with password match result
 *
 * @example
 * // Verify login attempt
 * const isValid = await verifyPassword('inputPassword', storedHash);
 * if (isValid) { /* grant access *\/ }
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// =============================================================================
// JWT FUNCTIONS
// =============================================================================

/**
 * Creates signed JWT token with secure defaults and random JWT ID
 *
 * @description Implements JWT best practices with algorithm enforcement,
 * proper expiration, and secure random token identifiers.
 *
 * @param {object} payload - Token payload data (will be JSON serialized)
 * @param {string} secret - JWT signing secret (min 256-bit entropy)
 * @param {object} [options={}] - JWT signing options (overrides defaults)
 * @returns {string} Signed JWT token
 * @throws {Error} If token signing fails (invalid secret or payload)
 *
 * @example
 * // Create access token
 * const token = createJWT(
 *   { userId: 123, role: 'admin' },
 *   process.env.JWT_SECRET
 * );
 *
 * @example
 * // Custom expiration
 * const shortToken = createJWT(
 *   { userId: 123 },
 *   process.env.JWT_SECRET,
 *   { expiresIn: '15m' }
 * );
 *
 * @since Version 1.0.0
 * @see {@link https://www.npmjs.com/package/jsonwebtoken} for options documentation
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
 * Verifies JWT token and returns decoded payload with full error handling
 *
 * @description Implements comprehensive JWT validation with proper error
 * handling and HTTP status code management. Supports custom error codes
 * for different authentication scenarios.
 *
 * @param {string} token - JWT token to verify (Bearer format expected)
 * @param {string} secret - JWT verification secret (must match signing secret)
 * @param {object} [options={}] - Verification options
 * @param {number} [customHttpError=401] - Custom HTTP error code for authentication failures
 * @returns {object} Decoded token payload
 * @throws {Boom} HTTP error with appropriate status code and message
 *
 * @example
 * // Standard verification
 * try {
 *   const payload = verifyJWT(token, process.env.JWT_SECRET);
 * } catch (error) {
 *   // Handle invalid token (already formatted as HTTP error)
 * }
 *
 * @example
 * // Custom error code for specific routes
 * try {
 *   const payload = verifyJWT(token, secret, {}, 403);
 * } catch (error) {
 *   // Will throw 403 instead of 401 for invalid tokens
 * }
 *
 * @since Version 1.0.0
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
 *
 * @description Stores security events with automatic TTL and list management.
 * Events are sanitized and stored with unique identifiers for correlation.
 *
 * @param {string} event - Event type identifier (e.g., 'LOGIN_FAILURE')
 * @param {object} [details={}] - Event details and metadata
 * @param {string} [level=THREAT_LEVELS.LOW] - Threat level from THREAT_LEVELS constants
 * @returns {Promise<string|null>} Event ID if successful, null on failure
 *
 * @example
 * // Log failed login attempt
 * await logSecurityEvent(
 *   'LOGIN_FAILURE',
 *   { username: 'testuser', ipAddress: '192.168.1.1' },
 *   THREAT_LEVELS.MEDIUM
 * );
 *
 * @since Version 1.2.0
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
 * Retrieves security events with optional filtering and sorting
 *
 * @description Fetches security events from Redis storage with filtering
 * capabilities. Returns events sorted by timestamp (newest first).
 *
 * @param {object} [filters={}] - Filter criteria
 * @param {number} [filters.limit=100] - Maximum number of events to return
 * @param {string} [filters.level=null] - Filter by threat level
 * @param {string} [filters.eventType=null] - Filter by event type
 * @returns {Promise<array>} Array of security events
 *
 * @example
 * // Get recent high threat events
 * const events = await getSecurityEvents({
 *   limit: 50,
 *   level: THREAT_LEVELS.HIGH
 * });
 *
 * @since Version 1.2.0
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
 *
 * @description Implements IP reputation system with automatic blocking
 * based on severity and frequency of incidents. Supports tiered blocking
 * durations with configurable thresholds.
 *
 * @param {string} ipAddress - IP address to mark (IPv4 or IPv6)
 * @param {string} reason - Reason for marking (e.g., 'BRUTE_FORCE_ATTEMPT')
 * @param {string} [severity=THREAT_LEVELS.MEDIUM] - Threat severity level
 * @returns {Promise<boolean>} Success status
 *
 * @example
 * // Mark IP for brute force attempt
 * await markSuspiciousIP(
 *   '192.168.1.1',
 *   'BRUTE_FORCE_ATTEMPT',
 *   THREAT_LEVELS.HIGH
 * );
 *
 * @since Version 1.3.0
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

  // JWT functions
  createJWT,
  verifyJWT,

  // Security monitoring
  logSecurityEvent,
  getSecurityEvents,

  // IP security
  markSuspiciousIP,
};
