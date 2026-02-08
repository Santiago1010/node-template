// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const Boom = require('@hapi/boom');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ContextHelper = require('./context.helper');
const i18n = require('../config/i18n');
const { getSequelize } = require('../config/database/connection');

/**
 * Deep converts empty objects/arrays to null
 * @param {*} obj - Object to process
 * @returns {*} Processed object
 */
const sanitizeEmptyObjects = (obj) => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.length === 0 ? null : obj.map(sanitizeEmptyObjects);
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;

    const sanitized = {};
    for (const key of keys) {
      sanitized[key] = sanitizeEmptyObjects(obj[key]);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Normalize and validate an HTTP status code. Returns a valid status code
 * (number between 100 and 599). If invalid, returns fallback (500).
 * @param {any} code
 * @param {number} fallback
 * @returns {number}
 */
const normalizeStatusCode = (code, fallback = 500) => {
  const n = Number(code);
  if (!Number.isInteger(n)) return fallback;
  if (n < 100 || n > 599) return fallback;
  return n;
};

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
const success = async (res, { httpCode = 200, messagePath, messageData = {}, data = {} } = {}) => {
  const responseData = {};

  if (messagePath) {
    try {
      let message = i18n.__(messagePath);

      if (typeof message === 'string' && messageData && Object.keys(messageData).length > 0) {
        message = i18n.__mf(messagePath, messageData);
      }

      if (typeof message === 'string') responseData.message = message;
    } catch (err) {
      console.error('i18n error:', err);
    }
  }

  if (Object.keys(data).length > 0) Object.assign(responseData, JSON.parse(JSON.stringify(data)));

  const response = res.status(normalizeStatusCode(httpCode, 200)).json(responseData);

  await registerHttpRequest(response, normalizeStatusCode(httpCode, 200), responseData);

  return response;
};

/**
 * Creates a Boom error with a custom HTTP status code and localized message.
 *
 * Usage (unchanged in callers): `throw error({ httpCode: 404, messagePath: 'auth.login.accountNotFound' })`
 *
 * @param {Object} options - Error configuration
 * @param {number} [options.httpCode=500] - HTTP status code for the error
 * @param {string} [options.messagePath] - Path to localized message
 * @param {Object} [options.messageData] - Data to pass to localized message
 * @param {any} [options.details] - Additional error details (optional, will be added to payload)
 *
 * @returns {Boom} Boom error object (ready to be thrown)
 */
const error = ({ httpCode = 500, messagePath, messageData, details } = {}) => {
  // Resolve message using i18n (fall back to a sensible default)
  let message;
  try {
    message = messagePath ? i18n.__mf(messagePath, messageData) : i18n.__('errors.internalServerError');
  } catch (_) {
    message = i18n.__('errors.internalServerError') || 'Internal Server Error';
  }

  if (!message) message = 'Internal Server Error';

  // Normalize status code
  const statusCode = normalizeStatusCode(httpCode, 500);

  // Create a standard Error
  const baseError = new Error(message);
  baseError.statusCode = statusCode;

  // Convert to Boom
  const boomError = Boom.boomify(baseError, { statusCode });

  // Clean up payload: remove stack & timestamp if any middleware adds them
  if (boomError.output?.payload) {
    delete boomError.output.payload.stack;
    delete boomError.output.payload.timestamp;
  }

  // Add custom details if provided
  if (details !== undefined) {
    boomError.output.payload.details = details;
  }

  return boomError;
};

/**
 * Registers HTTP request details to database
 * @param {Response} res - Express response object
 * @param {number} httpCode - HTTP status code
 * @param {Object} responseBody - Response body data
 * @param {Error} [error] - Optional error object for failed requests
 */
const registerHttpRequest = async (res, httpCode, responseBody, error = null) => {
  try {
    if (!res.req.user) return;

    const sequelize = await getSequelize();

    // Extract headers, excluding sensitive ones
    const {
      host: _,
      cookie: __,
      accept: ___,
      'x-path': ____,
      request_id: requestId,
      operation_id: operationId,
      ...headers
    } = res.req.headers;

    // Get context information
    const { page, endpoint } = ContextHelper.get();

    // Find access record
    const access = await sequelize.models.usrAccesses.findOne({
      attributes: ['id'],
      where: { accountId: res.req.user.id },
      include: {
        model: sequelize.models.usrDevices,
        as: 'device',
        attributes: [],
        where: { accountId: res.req.user.id, fingerprint: res.req.user.device.fingerprint },
        required: true,
      },
      raw: true,
    });

    // Prepare data for insertion
    const createData = sanitizeEmptyObjects({
      accessId: access.id,
      pageId: page.id,
      endpointId: endpoint.id,
      idRequest: requestId,
      idOperation: operationId || null,
      path: res.req.baseUrl || res.req.path,
      query: res.req.query,
      headers: headers,
      body: res.req.body,
      httpCode,
      responseBody: responseBody,
      statusCode: error?.statusCode || null,
      errorMessage: error?.message || null,
      errorStack: error?.stack || null,
    });

    // Insert into database
    await sequelize.models.logsHttpRequests.create(createData);
  } catch (err) {
    // Log error but don't throw to avoid breaking the request flow
    console.error('Error registering HTTP request:', err);
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { success, error, registerHttpRequest };
