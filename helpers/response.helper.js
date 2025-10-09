// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../config/i18n');

/**
 * Sends a successful JSON response with the given HTTP status code, optional
 * localized message, and additional response data.
 *
 * @param {Response} res - Express response object
 * @param {Object} [options] - Optional response configuration
 * @param {number} [options.httpCode=200] - HTTP status code
 * @param {string} [options.messagePath] - Path to localized message
 * @param {Object} [options.messageData] - Data to pass to localized message
 * @param {Object} [options.data={}] - Additional response data
 *
 * @returns {Response} Express response object with JSON response
 */
const success = (res, { httpCode = 200, messagePath, messageData, data = {} }) => {
  const responseData = messagePath ? { message: i18n.__mf(messagePath, messageData) } : {};
  Object.assign(responseData, data);

  return res.status(httpCode).json(responseData);
};

/**
 * Throws an error with a custom HTTP status code and localized message.
 *
 * @param {Object} options - Error configuration
 * @param {number} [options.httpCode=500] - HTTP status code for the error
 * @param {string} [options.messagePath] - Path to localized message
 * @param {Object} [options.messageData] - Data to pass to localized message
 * @param {string} [options.details] - Additional error details (optional)
 *
 * @returns {Error} Custom error object
 */
const error = ({ httpCode = 500, messagePath, messageData, details }) => {
  const message = messagePath
    ? i18n.__mf(messagePath, messageData)
    : i18n.__('errors.internalServerError') || 'Internal Server Error';

  const err = new Error(message);
  err.statusCode = httpCode;

  if (details) err.details = details;

  return err;
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { success, error };
