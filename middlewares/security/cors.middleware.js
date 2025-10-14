// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { getCorsConfiguration } = require('../../config/security/cors.config');

// =============================================================================
// CORS MIDDLEWARE SETUP
// =============================================================================

/**
 * Applies CORS configuration with error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const corsMiddleware = (req, res, next) => {
  const cors = require('cors');
  const corsHandler = cors(getCorsConfiguration());

  corsHandler(req, res, (err) => {
    if (err) {
      // Log CORS errors for monitoring
      console.warn('CORS validation failed:', {
        origin: req.headers.origin,
        path: req.path,
        method: req.method,
      });

      // Block request with appropriate error message
      return res.status(403).json({
        error: 'CORS policy violation',
        message: 'Cross-origin request denied by security policy',
        code: 'CORS_BLOCKED',
      });
    }

    // Add CORS headers to all responses (even non-CORS requests)
    res.setHeader('X-CORS-Policy', 'configured');
    next();
  });
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = corsMiddleware;
