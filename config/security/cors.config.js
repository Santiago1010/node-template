// =============================================================================
// CORS CONFIGURATION - Cross-Origin Resource Sharing Settings
// =============================================================================
// Configures cross-origin requests with environment-specific policies that balance
// security requirements with development flexibility. Proper CORS configuration is
// essential for modern web applications that consume APIs from different domains.
//
// Key Principles:
// - Environment-aware policies (development vs production)
// - Whitelist-based origin validation
// - Secure defaults with explicit exceptions
// - Preflight request optimization
// - Credential support for authenticated requests
//
// Security Considerations:
// - Avoid using wildcard (*) with credentials
// - Explicitly specify allowed methods and headers
// - Implement proper origin validation
// - Limit exposed headers to minimum necessary
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { isDevelopmentMode } = require('../../helpers/debug.helper');

/**
 * Determines if a given origin is allowed based on environment and whitelist
 * @param {string} origin - The origin to validate
 * @param {Function} callback - Standard CORS callback (error, allow)
 */
const originValidator = (origin, callback) => {
  // Allow requests with no origin (e.g., same-origin, mobile apps, curl requests)
  if (!origin) return callback(null, true);

  // Environment-specific origin handling
  if (isDevelopmentMode()) {
    // Development: Allow common local development origins
    const allowedOrigins = [
      /^https?:\/\/localhost(:\d+)?$/, // Localhost with any port
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/, // IPv4 loopback
      /^https?:\/\/\[::1\](:\d+)?$/, // IPv6 loopback
      process.env.FRONTEND_DEV_URL, // Additional development URL from env
    ].filter(Boolean);

    const isValidOrigin = allowedOrigins.some((allowedOrigin) =>
      typeof allowedOrigin === 'string' ? origin === allowedOrigin : allowedOrigin.test(origin)
    );

    return callback(null, isValidOrigin);
  }

  // Production: Strict origin validation
  const productionWhitelist = [
    process.env.PRIMARY_DOMAIN,
    process.env.SECONDARY_DOMAIN,
    ...(process.env.ALLOWED_DOMAINS || '').split(',').filter(Boolean),
  ];

  const isValidOrigin = productionWhitelist.includes(origin);
  callback(null, isValidOrigin);
};

/**
 * Main CORS configuration generator
 * @returns {Object} CORS configuration object
 */
const getCorsConfiguration = () => ({
  // Origin validation function
  origin: originValidator,

  // Allow credentials (cookies, authorization headers)
  // Note: Cannot use wildcard (*) origin when credentials are enabled
  credentials: true,

  // HTTP methods allowed in cross-origin requests
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],

  // Headers allowed in requests
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-Request-ID',
    'X-Timezone',
    'X-API-Version',
  ],

  // Headers exposed to the client
  exposedHeaders: ['Content-Length', 'X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],

  // Maximum age (in seconds) for preflight response caching
  // Reduces number of preflight requests for better performance
  maxAge: process.env.CORS_MAX_AGE || 86400, // Default: 24 hours

  // Enable successful (2xx) status code for OPTIONS requests
  // Some legacy clients require this
  optionsSuccessStatus: 200,

  // Enable strict CORS enforcement
  // Rejects requests that don't comply with CORS policy
  strict: !isDevelopmentMode(),
});

// =============================================================================
// ALTERNATIVE CONFIGURATIONS
// =============================================================================

/**
 * Strict CORS configuration for sensitive endpoints
 * Use for authentication, payment processing, or admin endpoints
 */
const getStrictCorsConfiguration = () => ({
  ...getCorsConfiguration(),
  methods: ['POST', 'OPTIONS'], // Limit to essential methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 300, // 5 minutes for sensitive endpoints
});

/**
 * Permissive CORS configuration for public APIs
 * Use for read-only endpoints that serve public content
 */
const getPermissiveCorsConfiguration = () => ({
  origin: true, // Allow all origins (use with caution)
  credentials: false, // No credentials needed for public data
  methods: ['GET', 'OPTIONS', 'HEAD'],
  maxAge: 86400, // 24 hours caching
});

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Main configuration function
  getCorsConfiguration,

  // Alternative configurations
  getStrictCorsConfiguration,
  getPermissiveCorsConfiguration,

  // Validator function for external use
  originValidator,
};
