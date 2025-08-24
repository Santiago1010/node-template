// =============================================================================
// HELMET SECURITY CONFIGURATION - Environment-aware security settings
// =============================================================================
// This configuration dynamically adjusts security headers based on environment
// (development vs production). It uses the Helmet.js library to set important
// security-related HTTP headers that help protect against common web vulnerabilities.
//
// Key principles:
// - Stricter security in production environment
// - More permissive settings in development for easier debugging
// - Nonce-based CSP for script execution control
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { isDevelopmentMode } = require('../../helpers/debug.helper');
const { generateSecureToken } = require('../../helpers/security.helper');

// Reusable nonce generator for Content Security Policy
// Nonces allow specific inline scripts to run while maintaining security
const generateNonce = (_, res) => {
  if (!res.locals.nonce) {
    res.locals.nonce = generateSecureToken(32); // Generate cryptographically secure nonce
  }

  return `'nonce-${res.locals.nonce}'`;
};

// Main security configuration function
const getHelmetConfiguration = () => {
  const isDev = isDevelopmentMode(true);

  // Base configuration (common to all environments)
  const baseConfig = {
    // Prevents cross-origin embedding of resources (disabled for better compatibility)
    crossOriginEmbedderPolicy: false,

    // Enables XSS filter in browsers (modern browsers don't need this but adds extra protection)
    xssFilter: true,

    // Prevents browsers from MIME-sniffing responses away from declared content type
    noSniff: true,

    // Prevents site from being embedded in iframes (clickjacking protection)
    frameguard: { action: 'deny' },

    // Controls DNS prefetching (disabled to prevent privacy leaks)
    dnsPrefetchControl: { allow: false },

    // Restricts Adobe Flash and Acrobat PDF cross-domain policies
    permittedCrossDomainPolicies: false,

    // Controls referrer information in HTTP headers (balances privacy and functionality)
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  };

  // Environment-specific configuration
  const envSpecificConfig = isDev
    ? {
        // More permissive settings for development
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"], // Default source: same origin only
            scriptSrc: ["'self'", generateNonce, "'unsafe-eval'"], // Allows eval() for development
            imgSrc: ["'self'", 'data:', 'https:'], // Images from self, data URIs, and HTTPS
            styleSrc: ["'self'", "'unsafe-inline'"], // Allows inline styles for development
            fontSrc: ["'self'", 'https:', 'data:'], // Fonts from self, HTTPS, and data URIs
            connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'], // Local dev connections
            objectSrc: ["'none'"], // No Flash/plugin content
            mediaSrc: ["'self'"], // Media files from self only
            frameSrc: ["'none'"], // No iframe embedding
          },
        },
        // HTTP Strict Transport Security (shorter duration in dev)
        hsts: {
          maxAge: 300, // 5 minutes - avoids long-term commitment in dev
          includeSubDomains: true, // Applies to all subdomains
          preload: false, // Excludes from browser preload list
        },
      }
    : {
        // Strict production settings
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", generateNonce, "'strict-dynamic'"], // Nonce-based script approval
            imgSrc: ["'self'", 'data:', 'https:'],
            styleSrc: ["'self'", "'unsafe-inline'"], // Note: Consider removing unsafe-inline for production
            fontSrc: ["'self'", 'https:', 'data:'],
            connectSrc: ["'self'"], // Restricts connections to same origin only
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: [], // Automatically upgrade HTTP to HTTPS
          },
        },
        hsts: {
          maxAge: 63072000, // 2 years - long duration for production
          includeSubDomains: true,
          preload: true, // Eligible for browser preload lists
        },
        // Certificate Transparency reporting
        expectCt: {
          enforce: true, // Requires valid CT info
          maxAge: 86400, // 24-hour reporting duration
          reportUri: '/api/v1/security/ct-report', // Where to send reports
        },
      };

  return { ...baseConfig, ...envSpecificConfig };
};

module.exports = getHelmetConfiguration;
