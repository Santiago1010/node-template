// =============================================================================
// WINSTON LOGGER CONFIGURATION - Professional Logging System
// =============================================================================
// Comprehensive Winston logging configuration with:
// - Multi-transport support (console, files, rotation)
// - Environment-aware logging levels
// - Sensitive data redaction
// - Integration with existing debug helper
// - Structured JSON logging for production
// - Colored console output for development
//
// Features:
// - Automatic log rotation and retention
// - Correlation IDs for request tracing
// - Performance monitoring
// - Security compliance with data redaction
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs');
const path = require('path');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { PATHS, LOG_COLORS, LOG_LEVELS, SENSITIVE_FIELDS } = require('../../utils/constants.util');
const { isDevelopmentMode } = require('../../helpers/debug.helper');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
winston.addColors(LOG_COLORS); // Register colors

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Ensures the logs directory exists
 * @private
 */
const ensureLogsDirectory = () => {
  if (!fs.existsSync(PATHS.LOGS)) {
    fs.mkdirSync(PATHS.LOGS, { recursive: true });
  }
};

/**
 * Redacts sensitive information from log metadata
 * @param {Object} meta - Log metadata object
 * @returns {Object} Sanitized metadata
 * @private
 */
const redactSensitiveData = (meta) => {
  if (!meta || typeof meta !== 'object') return meta;

  const sanitized = { ...meta };

  SENSITIVE_FIELDS.forEach((field) => {
    Object.keys(sanitized).forEach((key) => {
      if (key.toLowerCase().includes(field.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
      }
    });
  });

  return sanitized;
};

// =============================================================================
// CUSTOM FORMATS
// =============================================================================

/**
 * Development format with colors and detailed output
 */
const developmentFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const sanitizedMeta = redactSensitiveData(meta);

    let logMessage = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(sanitizedMeta).length > 0) {
      const formattedMeta = Object.entries(sanitizedMeta).reduce((acc, [key, value]) => {
        if (typeof value === 'object' && value !== null) {
          acc[key] = JSON.stringify(value, null, 2);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {});

      logMessage += `\n${JSON.stringify(formattedMeta, null, 2)}`;
    }

    if (stack) {
      logMessage += `\n${stack}`;
    }

    return logMessage;
  })
);

/**
 * Production format with structured JSON
 */
const productionFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    return {
      timestamp,
      level,
      message,
      stack,
      ...redactSensitiveData(meta),
    };
  })
);

// =============================================================================
// TRANSPORTS
// =============================================================================

/**
 * Console transport for real-time logging
 */
const consoleTransport = new winston.transports.Console({
  level: isDevelopmentMode() ? 'debug' : 'info',
  format: isDevelopmentMode() ? developmentFormat : productionFormat,
  silent: process.env.NODE_ENV === 'test',
});

/**
 * Daily rotating file transport for error logs
 */
const errorFileTransport = new DailyRotateFile({
  level: 'error',
  filename: path.join(PATHS.LOGS, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: productionFormat,
});

/**
 * Daily rotating file transport for combined logs
 */
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(PATHS.LOGS, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: productionFormat,
});

/**
 * Audit transport for critical security events
 */
const auditFileTransport = new DailyRotateFile({
  level: 'alert',
  filename: path.join(PATHS.LOGS, 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '365d', // Keep audit logs for a year
  format: productionFormat,
});

// =============================================================================
// LOGGER INSTANCE
// =============================================================================

// Ensure logs directory exists
ensureLogsDirectory();

/**
 * Main logger instance
 */
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: isDevelopmentMode() ? 'debug' : 'info',
  transports: [consoleTransport, errorFileTransport, combinedFileTransport, auditFileTransport],
  // Handle exceptions with the same transports
  exceptionHandlers: [consoleTransport, errorFileTransport],
  // Do not exit on handled exceptions
  exitOnError: false,
});

// =============================================================================
// CUSTOM LOGGING METHODS
// =============================================================================

/**
 * Correlation-aware logging method
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @param {string} correlationId - Request correlation ID
 */
const logWithCorrelation = (level, message, meta = {}, correlationId = '') => {
  const enhancedMeta = correlationId ? { ...meta, correlationId } : meta;

  logger.log(level, message, enhancedMeta);
};

/**
 * Performance logging method
 * @param {string} message - Performance message
 * @param {number} duration - Duration in milliseconds
 * @param {Object} meta - Additional metadata
 */
const performanceLog = (message, duration, meta = {}) => {
  logger.info(message, {
    ...meta,
    durationMs: duration,
    performance: true,
  });
};

/**
 * Security audit logging method
 * @param {string} event - Security event description
 * @param {Object} details - Event details
 * @param {string} userId - User ID if applicable
 */
const securityLog = (event, details = {}, userId = null) => {
  const auditDetails = userId ? { ...details, userId } : details;

  logger.alert(`SECURITY: ${event}`, {
    ...auditDetails,
    audit: true,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Business transaction logging method
 * @param {string} transactionType - Type of transaction
 * @param {Object} details - Transaction details
 * @param {string} status - Transaction status
 */
const transactionLog = (transactionType, details = {}, status = 'completed') => {
  logger.notice(`TRANSACTION: ${transactionType}`, {
    ...details,
    transactionType,
    status,
    timestamp: new Date().toISOString(),
  });
};

// =============================================================================
// REQUEST LOGGING MIDDLEWARE
// =============================================================================

/**
 * Express middleware for request logging
 * @returns {Function} Express middleware
 */
const requestLoggingMiddleware = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    const correlationId =
      req.headers['x-correlation-id'] ||
      req.requestId ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add correlation ID to request object
    req.correlationId = correlationId;

    // Log incoming request
    logWithCorrelation(
      'info',
      'Incoming request',
      {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        headers: redactSensitiveData(req.headers),
      },
      correlationId
    );

    // Capture response finish event
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      logWithCorrelation(
        'info',
        'Request completed',
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          durationMs: duration,
          contentLength: res.get('Content-Length'),
        },
        correlationId
      );

      // Log slow requests
      if (duration > 1000) {
        logWithCorrelation(
          'warn',
          'Slow request detected',
          {
            method: req.method,
            url: req.url,
            durationMs: duration,
            threshold: 1000,
          },
          correlationId
        );
      }
    });

    next();
  };
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Main logger instance
  logger,

  // Custom logging methods
  logWithCorrelation,
  performanceLog,
  securityLog,
  transactionLog,

  // Middleware
  requestLoggingMiddleware,

  // Utility functions (for testing)
  _redactSensitiveData: redactSensitiveData,
};
