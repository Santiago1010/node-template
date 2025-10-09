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

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { success };
