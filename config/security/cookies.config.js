// =============================================================================
// COOKIE SECURITY CONFIGURATION - Multi-Device Cookie Management
// =============================================================================
// Comprehensive cookie configuration that supports both web browsers and
// various device types (mobile apps, smart TVs, IoT devices, etc.) with
// appropriate security settings for each client type.
//
// Key Principles:
// - Device-aware cookie policies (web vs. native applications)
// - Secure-by-default configuration with environment-specific adjustments
// - Support for both session management and authentication tokens
// - Protection against common vulnerabilities (XSS, CSRF, session hijacking)
// - Compliance with privacy regulations across different device types
//
// Security Considerations:
// - Web browsers: Use standard cookie attributes (HttpOnly, Secure, SameSite)
// - Native devices: May require token-based authentication instead of cookies
// - Cross-device compatibility while maintaining security
// - Different session management strategies per device type
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { DEVICE_TYPES } = require('../../utils/constants.util');
const { isDevelopmentMode } = require('../../helpers/debug.helper');

// =============================================================================
// COOKIE CONFIGURATION GENERATOR
// =============================================================================

/**
 * Generates secure cookie configuration based on device type and environment
 * @param {Object} options - Cookie configuration options
 * @param {string} options.deviceType - Type of device (from DEVICE_TYPES)
 * @param {string} options.cookieType - Purpose of cookie (session, auth, csrf, etc.)
 * @param {boolean} options.httpOnly - Whether cookie is accessible only via HTTP(S)
 * @param {string} options.sameSite - SameSite attribute value
 * @param {number} options.maxAge - Maximum age in seconds
 * @returns {Object} Complete cookie configuration object
 */
const getCookieConfiguration = ({
  deviceType = DEVICE_TYPES.WEB_BROWSER,
  cookieType = 'session',
  httpOnly = true,
  sameSite = 'lax',
  maxAge = null,
} = {}) => {
  const isDev = isDevelopmentMode(true);

  // Base configuration applicable to all devices
  const baseConfig = {
    path: '/', // Available across entire site
    domain: process.env.COOKIE_DOMAIN || undefined, // Domain restriction
    maxAge: maxAge ? maxAge * 1000 : undefined, // Convert to milliseconds
  };

  // Device-specific configurations
  const deviceConfigs = {
    // Web browsers - standard cookie configuration
    [DEVICE_TYPES.WEB_BROWSER]: {
      secure: !isDev, // HTTPS only in production
      httpOnly: httpOnly, // Prevent JavaScript access
      sameSite: sameSite, // CSRF protection
    },

    // Mobile apps - often need less restrictive settings
    [DEVICE_TYPES.MOBILE_APP]: {
      secure: true, // Always HTTPS for apps
      httpOnly: false, // Often needs to be accessible to app code
      sameSite: 'none', // Cross-origin requests common
    },

    // Smart TVs - varied capabilities
    [DEVICE_TYPES.SMART_TV]: {
      secure: true,
      httpOnly: false, // TV browsers may have limited cookie support
      sameSite: 'none',
    },

    // IoT devices - minimal cookie support
    [DEVICE_TYPES.IOT_DEVICE]: {
      secure: true,
      httpOnly: false, // Often token-based instead of cookies
      sameSite: 'none',
    },

    // Desktop applications
    [DEVICE_TYPES.DESKTOP_APP]: {
      secure: true,
      httpOnly: false, // Accessible to application code
      sameSite: 'none',
    },

    // Game consoles
    [DEVICE_TYPES.GAME_CONSOLE]: {
      secure: true,
      httpOnly: false, // Console browsers vary in capability
      sameSite: 'none',
    },
  };

  // Cookie type configurations (override device defaults when needed)
  const cookieTypeConfigs = {
    // Session cookies - for maintaining user session state
    session: {
      // Web sessions typically shorter than app sessions
      maxAge:
        deviceType === DEVICE_TYPES.WEB_BROWSER
          ? 24 * 60 * 60
          : // 24 hours for web
            30 * 24 * 60 * 60, // 30 days for apps
    },

    // Authentication cookies - for storing authentication tokens
    auth: {
      httpOnly: deviceType === DEVICE_TYPES.WEB_BROWSER, // Only HTTPOnly for web
      sameSite: deviceType === DEVICE_TYPES.WEB_BROWSER ? 'strict' : 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 days for all devices
    },

    // CSRF tokens - for cross-site request forgery protection
    csrf: {
      httpOnly: false, // Must be accessible to JavaScript for web
      sameSite: deviceType === DEVICE_TYPES.WEB_BROWSER ? 'strict' : 'none',
      maxAge: 4 * 60 * 60, // 4 hours
    },
  };

  // Get device-specific configuration
  const deviceConfig = deviceConfigs[deviceType] || deviceConfigs[DEVICE_TYPES.WEB_BROWSER];

  // Get cookie-type specific configuration
  const typeConfig = cookieTypeConfigs[cookieType] || {};

  // Merge configurations with type-specific settings taking precedence
  return { ...baseConfig, ...deviceConfig, ...typeConfig };
};

// =============================================================================
// DEVICE-AWARE COOKIE MIDDLEWARE
// =============================================================================

/**
 * Middleware to automatically configure cookies based on device type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deviceAwareCookieMiddleware = (_, res, next) => {
  // Add cookie setter method with device-aware configuration
  res.setDeviceAwareCookie = (name, value, options = {}) => {
    const config = getCookieConfiguration({ ...options });

    res.cookie(name, value, config);
  };

  // Add cookie clearer with device-aware configuration
  res.clearDeviceAwareCookie = (name, options = {}) => {
    const config = getCookieConfiguration({ ...options });

    // Override for clear operation
    config.maxAge = 0;
    config.expires = new Date(0);

    res.cookie(name, '', config);
  };

  next();
};

// =============================================================================
// ALTERNATIVE AUTHENTICATION STRATEGIES
// =============================================================================

/**
 * For non-web devices, consider token-based authentication instead of cookies
 * @param {Object} req - Express request object
 * @returns {boolean} Whether to use tokens instead of cookies
 */
const shouldUseTokensInstead = (_) => {
  // Devices that typically work better with tokens than cookies
  const tokenPreferredDevices = [DEVICE_TYPES.MOBILE_APP, DEVICE_TYPES.IOT_DEVICE, DEVICE_TYPES.DESKTOP_APP];

  return tokenPreferredDevices;
};

/**
 * Middleware to handle authentication method selection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authStrategyMiddleware = (req, _, next) => {
  if (shouldUseTokensInstead(req)) {
    // Set flag to use token-based authentication
    req.useTokenAuth = true;

    // Skip cookie-based authentication for this request
    return next();
  }

  // Proceed with cookie-based authentication
  req.useTokenAuth = false;
  next();
};

// =============================================================================
// RESPONSE HEADER CONFIGURATION
// =============================================================================

/**
 * Sets security headers appropriate for the device type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const setDeviceAwareSecurityHeaders = (req, res, next) => {
  const deviceType = req.deviceType || DEVICE_TYPES.WEB_BROWSER;

  // Common security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Device-specific headers
  if (deviceType === DEVICE_TYPES.WEB_BROWSER) {
    // Additional web-specific headers
    res.setHeader('Permissions-Policy', 'interest-cohort=()');
  }

  // Add device type to headers for client awareness
  res.setHeader('X-Device-Type', deviceType);

  next();
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Main configuration function
  getCookieConfiguration,

  // Middleware functions
  deviceAwareCookieMiddleware,
  authStrategyMiddleware,
  setDeviceAwareSecurityHeaders,

  // Helper functions
  shouldUseTokensInstead,
};
