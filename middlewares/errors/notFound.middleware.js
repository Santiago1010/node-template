// =============================================================================
// NOT FOUND HANDLER MIDDLEWARE - Express Smart 404 Handler with Enhanced Logging
// =============================================================================
// Comprehensive 404 error handling middleware for Express applications.
// Provides multiple approaches to handle missing routes with intelligent suggestions,
// detailed logging, and optional redirect capabilities.
//
// Key Features:
// - Detailed logging of 404 requests with Winston
// - Intelligent route suggestions for common typos and similar paths
// - API vs non-API request differentiation
// - Configurable redirect options for common URL changes
// - Levenshtein distance algorithm for similarity matching
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const boom = require('@hapi/boom'); // HTTP error utilities
const dayjs = require('dayjs'); // Date/time manipulation

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { logger } = require('../../config/tools/logger.config'); // Winston logger

/**
 * Basic 404 handler middleware for Express applications
 * Logs missing route details and returns a formatted 404 error
 * @param {Request} req - Express request object
 * @param {Response} _ - Express response object (unused)
 * @param {NextFunction} next - Express next function
 *
 * @example
 * // Use as the last middleware in your Express app
 * app.use(notFoundHandler);
 */
const notFoundHandler = (req, _, next) => {
  // Log missing route details for analysis
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: dayjs().format(), // Using day.js for consistent timestamp formatting
    headers: req.headers,
    query: req.query,
    params: req.params,
  });

  // Determine if this is an API request
  const isApiRequest =
    req.originalUrl.startsWith('/api') ||
    req.get('Accept')?.includes('application/json') ||
    req.get('Content-Type')?.includes('application/json');

  let message = 'Resource not found';
  let additionalInfo = {};

  // Customize response for API requests
  if (isApiRequest) {
    message = `Endpoint ${req.method} ${req.originalUrl} not found`;
    additionalInfo = {
      method: req.method,
      path: req.originalUrl,
      availableEndpoints: getAvailableEndpoints(),
      suggestion: getSuggestion(req.originalUrl),
    };
  }

  // Create and pass Boom error to next middleware
  const error = boom.notFound(message, additionalInfo);
  next(error);
};

/**
 * Configurable smart 404 handler with enhanced features
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableSuggestions - Whether to provide route suggestions
 * @param {boolean} options.enableLogging - Whether to log 404 events
 * @param {string} options.customMessage - Custom error message
 * @param {Object} options.redirects - URL redirect mappings
 * @returns {Function} Express middleware function with enhanced 404 handling
 *
 * @example
 * // Configure with custom options
 * app.use(smartNotFoundHandler({
 *   enableSuggestions: true,
 *   enableLogging: process.env.NODE_ENV === 'production',
 *   redirects: {
 *     '/old-path': '/new-path',
 *     '/legacy-api': '/api/v2'
 *   }
 * }));
 */
const smartNotFoundHandler = (options = {}) => {
  const { enableSuggestions = true, enableLogging = true, customMessage = null, redirects = {} } = options;

  return (req, res, next) => {
    // Log event if enabled
    if (enableLogging) {
      logger.warn('Smart 404 handler triggered', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        timestamp: dayjs().format(), // Using day.js for consistent timestamp formatting
      });
    }

    // Check for configured redirects
    const redirect = redirects[req.originalUrl] || redirects[req.path];
    if (redirect) {
      return res.redirect(301, redirect);
    }

    // Prepare additional information
    let additionalInfo = {
      method: req.method,
      path: req.originalUrl,
      timestamp: dayjs().format(), // Using day.js for consistent timestamp formatting
    };

    // Add suggestions if enabled
    if (enableSuggestions) {
      additionalInfo.suggestions = generateSuggestions(req.originalUrl);
      additionalInfo.similarPaths = findSimilarPaths(req.originalUrl);
    }

    // Use custom message if provided
    const message = customMessage || `Resource ${req.originalUrl} not found on the server`;

    const error = boom.notFound(message, additionalInfo);
    next(error);
  };
};

/**
 * Returns a list of available API endpoints
 * Should be integrated with your actual route system
 * @returns {Array<string>} List of available endpoints
 * @private
 */
const getAvailableEndpoints = () => {
  // This function should integrate with your actual routing system
  // Returns common endpoints as an example
  return [
    'GET /api/health',
    'GET /api/users',
    'POST /api/users',
    'GET /api/users/:id',
    'PUT /api/users/:id',
    'DELETE /api/users/:id',
  ];
};

/**
 * Provides route suggestions for common URL mistakes
 * @param {string} requestedUrl - The URL that was not found
 * @returns {string|null} Suggested correct URL or null
 * @private
 */
const getSuggestion = (requestedUrl) => {
  const suggestions = {
    '/api/user': '/api/users',
    '/api/login': '/api/auth/login',
    '/api/register': '/api/auth/register',
    '/api/logout': '/api/auth/logout',
    '/health': '/api/health',
    '/status': '/api/health',
  };

  // Exact match
  if (suggestions[requestedUrl]) {
    return suggestions[requestedUrl];
  }

  // Partial match
  for (const [pattern, suggestion] of Object.entries(suggestions)) {
    if (requestedUrl.includes(pattern) || pattern.includes(requestedUrl)) {
      return suggestion;
    }
  }

  return null;
};

/**
 * Generates similar endpoint suggestions using Levenshtein distance
 * @param {string} requestedUrl - The URL that was not found
 * @returns {Array<string>} Array of suggested endpoints
 * @private
 */
const generateSuggestions = (requestedUrl) => {
  const commonEndpoints = [
    '/api/health',
    '/api/users',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/docs',
  ];

  const suggestions = commonEndpoints
    .map((endpoint) => ({
      endpoint,
      distance: levenshteinDistance(requestedUrl, endpoint),
    }))
    .filter((item) => item.distance <= 5) // Only include reasonably similar endpoints
    .sort((a, b) => a.distance - b.distance) // Sort by similarity
    .slice(0, 3) // Return top 3 suggestions
    .map((item) => item.endpoint);

  return suggestions;
};

/**
 * Finds similar paths based on common URL patterns
 * @param {string} requestedUrl - The URL that was not found
 * @returns {Array<string>} Array of similar paths
 * @private
 */
const findSimilarPaths = (requestedUrl) => {
  const pathSegments = requestedUrl.split('/').filter(Boolean);

  if (pathSegments.length === 0) return [];

  const similarPaths = [];

  // Handle plural/singular variations
  const lastSegment = pathSegments[pathSegments.length - 1];
  if (lastSegment.endsWith('s')) {
    const singular = lastSegment.slice(0, -1);
    similarPaths.push('/' + [...pathSegments.slice(0, -1), singular].join('/'));
  } else {
    const plural = lastSegment + 's';
    similarPaths.push('/' + [...pathSegments.slice(0, -1), plural].join('/'));
  }

  // Add API prefix if missing
  if (!requestedUrl.startsWith('/api')) {
    similarPaths.push('/api' + requestedUrl);
  }

  return similarPaths.slice(0, 2);
};

/**
 * Calculates Levenshtein distance between two strings
 * Measures the difference between two sequences
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Distance between the two strings
 * @private
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1)
    .fill()
    .map(() => Array(str1.length + 1).fill(0));

  // Initialize matrix
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  // Calculate distances
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1, // deletion
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { notFoundHandler, smartNotFoundHandler };
