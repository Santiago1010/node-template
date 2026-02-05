// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment-timezone'); // Timezone-aware date manipulation

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { logger } = require('../../config/tools/logger.config'); // Winston logger

/**
 * Main request logging middleware with comprehensive configuration options
 * @param {Object} options - Configuration options
 * @param {string} options.logLevel - Winston log level ('info', 'debug', 'warn', 'error')
 * @param {boolean} options.logErrors - Whether to log errors during request processing
 * @param {Array} options.sensitiveFields - List of field names to redact from logs
 * @param {string} options.timezone - Timezone for timestamp generation
 * @returns {Function} Express middleware function for request logging
 *
 * @example
 * // Basic usage
 * app.use(requestLogger());
 *
 * // Custom configuration
 * app.use(requestLogger({
 *   logLevel: 'debug',
 *   sensitiveFields: ['password', 'creditCard'],
 *   timezone: 'America/New_York'
 * }));
 */
const requestLogger = (options = {}) => {
  const {
    logLevel = 'info',
    logErrors = true,
    sensitiveFields = ['password', 'token', 'authorization', 'cookie'],
    timezone = 'America/Bogota',
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Add request ID to request object for tracking throughout the request lifecycle
    req.requestId = requestId;

    // Collect request information with sensitive data redaction
    const requestInfo = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      referer: req.get('Referer'),
      timestamp: moment().tz(timezone).format(),
      headers: sanitizeHeaders(req.headers, sensitiveFields),
      query: req.query,
      params: req.params,
      body: sanitizeBody(req.body, sensitiveFields),
    };

    // Log incoming request details
    logger.log(logLevel, 'Incoming request', requestInfo);

    // Intercept response methods to log response details
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function (data) {
      logResponse(req, res, data, startTime, options);
      originalSend.call(this, data);
    };

    res.json = function (data) {
      logResponse(req, res, data, startTime, options);
      originalJson.call(this, data);
    };

    // Intercept error handling to log errors with context
    const originalNext = next;
    req.next = (error) => {
      if (error && logErrors) {
        logError(req, res, error, startTime, options);
      }
      originalNext(error);
    };

    next();
  };
};

/**
 * Error logging middleware for Express applications
 * Logs detailed error information with request context
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 *
 * @example
 * // Use after routes and before final error handler
 * app.use(errorLogger);
 */
const errorLogger = (error, req, _, next) => {
  const errorInfo = {
    requestId: req.requestId || 'unknown',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status || error.statusCode,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: sanitizeHeaders(req.headers, ['password', 'authorization', 'cookie']),
      query: req.query,
      params: req.params,
      body: sanitizeBody(req.body, ['password', 'token']),
    },
    timestamp: moment().tz('America/Bogota').format(),
    severity: determineSeverity(error),
  };

  // Determine appropriate log level based on error severity
  const logLevel = errorInfo.severity === 'critical' ? 'error' : errorInfo.severity === 'high' ? 'warn' : 'info';

  logger.log(logLevel, 'Request error occurred', errorInfo);

  next(error);
};

/**
 * Performance monitoring middleware for Express applications
 * Tracks request duration, memory usage, and identifies slow requests
 * @param {Object} options - Configuration options
 * @param {number} options.slowRequestThreshold - Threshold in ms for slow request detection
 * @param {boolean} options.enableMetrics - Whether to log performance metrics
 * @param {boolean} options.logHeaders - Whether to include response headers in logs
 * @returns {Function} Express middleware function for performance monitoring
 *
 * @example
 * // Monitor performance with custom thresholds
 * app.use(performanceLogger({
 *   slowRequestThreshold: 500,
 *   enableMetrics: true
 * }));
 */
const performanceLogger = (options = {}) => {
  const { slowRequestThreshold = 1000, enableMetrics = true, logHeaders = false } = options;

  return (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      const performanceData = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        memory: {
          heapUsed: `${(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024}MB`,
          external: `${(endMemory.external - startMemory.external) / 1024 / 1024}MB`,
        },
        timestamp: moment().tz('America/Bogota').format(),
      };

      // Include response headers if configured
      if (logHeaders) {
        performanceData.responseHeaders = res.getHeaders();
      }

      // Log slow requests with additional details
      if (duration > slowRequestThreshold) {
        logger.warn('Slow request detected', {
          ...performanceData,
          threshold: `${slowRequestThreshold}ms`,
          slowBy: `${(duration - slowRequestThreshold).toFixed(2)}ms`,
        });
      }

      // Log general performance metrics if enabled
      if (enableMetrics) {
        logger.info('Request performance', performanceData);
      }
    });

    next();
  };
};

/**
 * Logs response details including status code, duration, and content length
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {number} startTime - Request start time in milliseconds
 * @param {Object} options - Configuration options
 * @private
 */
const logResponse = (req, res, data, startTime, options) => {
  const duration = Date.now() - startTime;
  const { slowRequestThreshold = 1000, timezone = 'America/Bogota' } = options;

  const responseInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    contentLength: res.get('Content-Length') || (data ? JSON.stringify(data).length : 0),
    timestamp: moment().tz(timezone).format(),
    responseHeaders: res.getHeaders(),
  };

  // Different log levels based on status code and duration
  if (res.statusCode >= 400) {
    logger.warn('Request completed with error status', responseInfo);
  } else if (duration > slowRequestThreshold) {
    logger.warn('Slow request completed', {
      ...responseInfo,
      threshold: `${slowRequestThreshold}ms`,
    });
  } else {
    logger.info('Request completed successfully', responseInfo);
  }
};

/**
 * Logs error details with request context
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {number} startTime - Request start time in milliseconds
 * @param {Object} options - Configuration options
 * @private
 */
const logError = (req, _, error, startTime, options) => {
  const duration = Date.now() - startTime;
  const { timezone = 'America/Bogota' } = options;

  const errorLog = {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      code: error.code,
      status: error.status || error.statusCode,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      duration: `${duration}ms`,
    },
    timestamp: moment().tz(timezone).format(),
    severity: determineSeverity(error),
  };

  logger.error('Request error during processing', errorLog);
};

/**
 * Generates a unique request ID for tracking purposes
 * @returns {string} Unique request identifier
 * @private
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitizes headers by redacting sensitive fields
 * @param {Object} headers - Request headers object
 * @param {Array} sensitiveFields - List of sensitive field names to redact
 * @returns {Object} Sanitized headers object
 * @private
 */
const sanitizeHeaders = (headers, sensitiveFields) => {
  const sanitized = { ...headers };

  sensitiveFields.forEach((field) => {
    const lowerField = field.toLowerCase();
    Object.keys(sanitized).forEach((key) => {
      if (key.toLowerCase().includes(lowerField)) {
        sanitized[key] = '***REDACTED***';
      }
    });
  });

  return sanitized;
};

/**
 * Sanitizes request body by redacting sensitive fields
 * @param {Object} body - Request body object
 * @param {Array} sensitiveFields - List of sensitive field names to redact
 * @returns {Object} Sanitized body object
 * @private
 */
const sanitizeBody = (body, sensitiveFields) => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };

  sensitiveFields.forEach((field) => {
    Object.keys(sanitized).forEach((key) => {
      if (key.toLowerCase().includes(field.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
      }
    });
  });

  return sanitized;
};

/**
 * Determines error severity based on HTTP status code
 * @param {Error} error - Error object with status code
 * @returns {string} Severity level ('critical', 'high', 'medium', 'low')
 * @private
 */
const determineSeverity = (error) => {
  const status = error.status || error.statusCode || 500;

  if (status >= 500) return 'critical';
  if (status >= 400) return 'high';
  if (status >= 300) return 'medium';
  return 'low';
};

/**
 * Factory class for creating pre-configured logger instances
 * Provides standardized logging configurations for different environments
 */
class RequestLoggerFactory {
  /**
   * Creates a logger optimized for specific API endpoints
   * @param {string} apiName - Name of the API for contextual logging
   * @param {Object} options - Additional configuration options
   * @returns {Function} Configured request logger middleware
   * @static
   */
  static createApiLogger(apiName, options = {}) {
    return requestLogger({
      ...options,
      logLevel: 'info',
      apiName,
    });
  }

  /**
   * Creates a verbose logger for debugging purposes
   * @param {Object} options - Additional configuration options
   * @returns {Function} Configured request logger middleware
   * @static
   */
  static createDebugLogger(options = {}) {
    return requestLogger({
      ...options,
      logLevel: 'debug',
      logErrors: true,
      slowRequestThreshold: 500,
    });
  }

  /**
   * Creates a security-focused logger for production environments
   * @param {Object} options - Additional configuration options
   * @returns {Function} Configured request logger middleware
   * @static
   */
  static createProductionLogger(options = {}) {
    return requestLogger({
      ...options,
      logLevel: 'warn',
      logErrors: true,
      slowRequestThreshold: 2000,
      sensitiveFields: ['password', 'token', 'authorization', 'cookie', 'session'],
    });
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { requestLogger, errorLogger, performanceLogger, RequestLoggerFactory };
