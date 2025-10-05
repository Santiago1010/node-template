// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const i18n = require('../config/i18n');

/**
 * Sends a successful response with a given HTTP status code and
 * i18n-formatted message.
 *
 * @param {Response} res - Express response object
 * @param {{ httpCode: number, messagePath: string, messageData: object, data: object }}
 *   @property {number} httpCode - HTTP status code to send
 *   @property {string} messagePath - i18n message path to format
 *   @property {object} messageData - i18n message formatting data
 *   @property {object} [data={}] - Optional data to include in the response
 */
const success = (res, { httpCode = 200, messagePath, messageData, data }) => {
  return res.status(httpCode).json({ message: i18n.__mf(messagePath, messageData), ...data });
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { success };
