// =============================================================================
// ERROR HANDLER MIDDLEWARE - Centralized Express Error Handling
// =============================================================================
// Centralized error handling middleware for Express applications.
// Handles various error types including:
// - Boom HTTP errors
// - Sequelize database errors
// - Zod validation errors
// - JWT authentication errors
// - General validation errors
// - Syntax errors
// - Generic unexpected errors
//
// Features:
// - Comprehensive error logging with Winston
// - Internationalization support
// - Development/production mode differentiation
// - Structured error response formatting
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
const i18n = require('../../config/i18n'); // Internationalizationn
const { logger } = require('../../config/tools/logger.config'); // Winston logger
const { isDevelopmentMode } = require('../../helpers/debug.helper'); // Environment detectio

/**
 * Central error handling middleware for Express applications
 * @param {Error} error - The error object passed from previous middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const errorHandler = (error, req, res, next) => {
  // Log error details with Winston
  logger.error('Error caught by errorHandler middleware:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: dayjs().format(),
  });

  // Skip processing if headers already sent
  if (res.headersSent) return next(error);

  let boomError;

  // Handle different error types
  if (boom.isBoom(error)) {
    boomError = error;
  } else if (error.name?.includes('Sequelize')) {
    boomError = handleSequelizeError(error, req);
  } else if (error.name === 'ZodError') {
    boomError = handleZodError(error, req);
  } else if (error.type === 'validation') {
    boomError = handleValidationError(error, req);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    boomError = boom.unauthorized(i18n.__('error.invalid_token'));
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    boomError = boom.badRequest(i18n.__('error.malformed_json'));
  } else {
    // Generic error handling with environment-specific messaging
    const isProduction = !isDevelopmentMode();
    boomError = boom.internal(isProduction ? i18n.__('error.internal_server') : error.message);
  }

  const { statusCode, payload } = boomError.output;

  // Send formatted error response
  res.status(statusCode).json(payload);
};

/**
 * Handles Sequelize-specific database errors
 * @param {Error} error - Sequelize error object
 * @param {Request} req - Express request object
 * @returns {Boom} Properly formatted Boom error
 */
const handleSequelizeError = (error, _) => {
  switch (error.name) {
    case 'SequelizeValidationError': {
      const validationErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      return boom.badRequest(i18n.__('error.validation'), {
        errors: validationErrors,
      });
    }

    case 'SequelizeUniqueConstraintError': {
      const uniqueErrors = error.errors.map((err) => ({
        field: err.path,
        message: i18n.__('error.unique_constraint', { value: err.value }),
        value: err.value,
      }));

      return boom.conflict(i18n.__('error.unique_conflict'), {
        errors: uniqueErrors,
      });
    }

    case 'SequelizeForeignKeyConstraintError':
      return boom.badRequest(i18n.__('error.foreign_key'));

    case 'SequelizeConnectionError':
      return boom.internal(i18n.__('error.db_connection'));

    case 'SequelizeTimeoutError':
      return boom.requestTimeout(i18n.__('error.db_timeout'));

    default:
      return boom.internal(i18n.__('error.database'));
  }
};

/**
 * Handles Zod validation errors
 * @param {Error} error - Zod error object
 * @param {Request} req - Express request object
 * @returns {Boom} Properly formatted Boom error
 */
const handleZodError = (error, _) => {
  const zodErrors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    value: err.received,
  }));

  return boom.badRequest(i18n.__('error.validation'), { errors: zodErrors });
};

/**
 * Handles general validation errors
 * @param {Error} error - Validation error object
 * @param {Request} req - Express request object
 * @returns {Boom} Properly formatted Boom error
 */
const handleValidationError = (error, _) => {
  const validationErrors = error.errors.map((err) => ({
    field: err.param || err.path,
    message: err.msg,
    value: err.value,
    location: err.location,
  }));

  return boom.badRequest(i18n.__('error.validation'), { errors: validationErrors });
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = errorHandler;
