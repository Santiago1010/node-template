// =============================================================================
// RATE LIMIT CONFIGURATION
// =============================================================================
// Comprehensive rate limiting configuration for the application with multiple
// tiers of protection and environment-specific settings.
//
// Features:
// - Multiple rate limit tiers (general, auth, critical, upload)
// - Environment-aware limits (development vs production)
// - Enhanced key generation with multiple request components
// - Custom rate limiter middleware for special cases
// - Comprehensive security headers
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const rateLimit = require('express-rate-limit');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../i18n');
const { isDevelopmentMode } = require('../../helpers/debug.helper');
const { SECURITY_CONFIG } = require('../../helpers/constants.helper');
const { checkRateLimit } = require('../../helpers/security.helper');

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Enhanced key generator for rate limiting
 * Creates a unique identifier based on multiple request components
 * @param {Object} req - Express request object
 * @returns {string} Unique key for rate limiting
 */
const enhancedKeyGenerator = (req) => {
  const components = [
    req.ip,
    req.headers['user-agent']?.substring(0, 50),
    req.headers['accept-language']?.substring(0, 10),
  ].filter(Boolean);

  return components.join('_');
};

/**
 * Base configuration for all rate limiters
 * Provides common settings and error handling
 */
const baseLimiterConfig = {
  handler: (_, res) => {
    res.status(429).json({
      error: i18n.__('errors.tooManyRequests'),
      retryAfter: Math.ceil(res.get('Retry-After') || 60),
    });
  },

  skip: (_, __) => isDevelopmentMode(), // Skip rate limiting in development
  headers: true, // Include rate limit headers in responses
  legacyHeaders: false, // Disable deprecated headers
};

// =============================================================================
// RATE LIMIT TIERS
// =============================================================================

/**
 * General API rate limiter
 * Suitable for most API endpoints with moderate protection
 */
const generalLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW,
  max: isDevelopmentMode() ? 1000 : SECURITY_CONFIG.RATE_LIMIT.DEFAULT_MAX_REQUESTS,
  keyGenerator: enhancedKeyGenerator,
  message: {
    error: i18n.__('errors.tooManyRequests'),
    type: 'general_rate_limit',
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Provides enhanced protection for login, registration, and password reset
 */
const authLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: SECURITY_CONFIG.RATE_LIMIT.STRICT_WINDOW,
  max: isDevelopmentMode() ? 50 : SECURITY_CONFIG.RATE_LIMIT.STRICT_MAX_REQUESTS,
  keyGenerator: enhancedKeyGenerator,
  message: {
    error: i18n.__('errors.tooManyAttempts'),
    type: 'auth_rate_limit',
  },
});

/**
 * Critical operations rate limiter
 * Protects sensitive operations like account deletion, admin actions
 */
const criticalLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDevelopmentMode() ? 100 : 10,
  keyGenerator: enhancedKeyGenerator,
  skipFailedRequests: true, // Don't count failed requests
  message: {
    error: i18n.__('errors.criticalOperationLimit'),
    type: 'critical_rate_limit',
  },
});

/**
 * File upload rate limiter
 * Protects against abuse of file upload functionality
 */
const uploadLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopmentMode() ? 20 : 5,
  keyGenerator: enhancedKeyGenerator,
  message: {
    error: i18n.__('errors.uploadLimitExceeded'),
    type: 'upload_rate_limit',
  },
});

// =============================================================================
// CUSTOM RATE LIMITER MIDDLEWARE
// =============================================================================

/**
 * Custom rate limiter middleware for special cases
 * Uses the application's internal rate limiting system
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
const customRateLimiter = (options = {}) => {
  return (req, res, next) => {
    // Skip rate limiting in development if configured
    if (isDevelopmentMode() && options.skipInDevelopment) return next();

    const result = checkRateLimit(enhancedKeyGenerator(req), {
      windowMs: options.windowMs || SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW,
      maxRequests: options.maxRequests || SECURITY_CONFIG.RATE_LIMIT.DEFAULT_MAX_REQUESTS,
      keyPrefix: options.keyPrefix || 'custom_rate_limit',
    });

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        error: i18n.__('errors.tooManyRequests'),
        retryAfter: result.retryAfter,
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests || SECURITY_CONFIG.RATE_LIMIT.DEFAULT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime);

    next();
  };
};

/**
 * Middleware to add rate limit policy headers
 * Informs clients about the rate limiting policy
 */
const rateLimitHeaders = (_, res, next) => {
  res.setHeader('X-RateLimit-Policy', 'multi-tier');
  res.setHeader('RateLimit-Limit', '1000, 100, 10, 5');
  res.setHeader('RateLimit-Window', '15m, 5m, 5m, 15m');

  next();
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Rate limit tiers
  generalLimiter,
  authLimiter,
  criticalLimiter,
  uploadLimiter,

  // Custom rate limiter
  customRateLimiter,

  // Header middleware
  rateLimitHeaders,

  // Key generator (for testing or special use cases)
  enhancedKeyGenerator,
};
