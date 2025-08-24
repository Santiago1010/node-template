// =============================================================================
// HTTP REQUEST CONTEXT MIDDLEWARE
// =============================================================================
// Middleware functions to extract and store HTTP request information in context
// =============================================================================

const { setContextValue, setContextValues } = require('../../helpers/context.helper');

/**
 * Middleware to extract host and x-path header information and store in context
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const extractRequestContext = (req, res, next) => {
  try {
    // Extract host from request
    const host = req.get('host') || req.headers.host;
    if (!host) {
      return res.status(400).json({
        error: 'Host information is missing from the request',
      });
    }

    // Extract x-path header
    const xPathHeader = req.get('x-path') || req.headers['x-path'];
    if (!xPathHeader) {
      return res.status(400).json({
        error: 'x-path header is required but missing from the request',
      });
    }

    // Parse x-path header (assuming it's JSON format)
    let pathInfo;
    try {
      pathInfo = JSON.parse(xPathHeader);
    } catch (_) {
      return res.status(400).json({
        error: 'x-path header contains invalid JSON format',
      });
    }

    // Validate required fields in x-path
    const requiredFields = ['name', 'path', 'requiresAuthorization', 'description', 'level', 'hasSensitiveInformation'];
    const missingFields = requiredFields.filter((field) => !(field in pathInfo));

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields in x-path header: ${missingFields.join(', ')}`,
      });
    }

    // Store both pieces of information in context
    setContextValues({
      request_host: host,
      path_name: pathInfo.name,
      path_route: pathInfo.path,
      path_requires_authorization: pathInfo.requiresAuthorization,
      path_description: pathInfo.description,
      path_level: pathInfo.level,
      path_has_sensitive_information: pathInfo.hasSensitiveInformation,
    });

    next();
  } catch (error) {
    return res.status(500).json({
      error: `Failed to process request context: ${error.message}`,
    });
  }
};

/**
 * Alternative middleware with separate functions for host and path extraction
 */
const extractHostMiddleware = (req, res, next) => {
  try {
    const host = req.get('host') || req.headers.host;
    if (!host) {
      return res.status(400).json({
        error: 'Host information is missing from the request',
      });
    }

    setContextValue('request_host', host);
    next();
  } catch (error) {
    return res.status(500).json({
      error: `Failed to extract host information: ${error.message}`,
    });
  }
};

const extractPathInfoMiddleware = (req, res, next) => {
  try {
    const xPathHeader = req.get('x-path') || req.headers['x-path'];
    if (!xPathHeader) {
      return res.status(400).json({
        error: 'x-path header is required but missing from the request',
      });
    }

    let pathInfo;
    try {
      pathInfo = JSON.parse(xPathHeader);
    } catch (_) {
      return res.status(400).json({
        error: 'x-path header contains invalid JSON format',
      });
    }

    const requiredFields = ['name', 'path', 'requiresAuthorization', 'description', 'level', 'hasSensitiveInformation'];
    const missingFields = requiredFields.filter((field) => !(field in pathInfo));

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields in x-path header: ${missingFields.join(', ')}`,
      });
    }

    setContextValues({
      path_name: pathInfo.name,
      path_route: pathInfo.path,
      path_requires_authorization: pathInfo.requiresAuthorization,
      path_description: pathInfo.description,
      path_level: pathInfo.level,
      path_has_sensitive_information: pathInfo.hasSensitiveInformation,
    });

    next();
  } catch (error) {
    return res.status(500).json({
      error: `Failed to extract path information: ${error.message}`,
    });
  }
};

/**
 * Combined middleware that can be used as a single function
 */
const requestContextMiddleware = (req, res, next) => {
  extractHostMiddleware(req, res, (hostError) => {
    if (hostError) return;

    extractPathInfoMiddleware(req, res, (pathError) => {
      if (pathError) return;
      next();
    });
  });
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  extractRequestContext,
  extractHostMiddleware,
  extractPathInfoMiddleware,
  requestContextMiddleware,
};
