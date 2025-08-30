/**
 * @function standardRequest
 * @description Creates a standard request object with the given information,
 *              using the given HTTP method type.
 * @param {string} type - The HTTP method type.
 * @param {Object} [options] - An object containing information about the
 *                             request.
 * @param {Array<string>} [options.tags] - An array of strings denoting the
 *                                         tags associated with the request.
 * @param {string} [options.description] - A brief description of the request.
 * @param {string} [options.operationId] - A unique identifier for the request.
 * @param {Array<Object>} [options.parameters] - An array of parameter objects
 *                                               that describe the request.
 * @param {Object} [options.requestBody] - An object describing the request body.
 * @param {Object} [options.security] - An object describing the security
 *                                     requirements for the request.
 * @param {Object} [options.responses] - An object describing the possible
 *                                      responses to the request.
 * @returns {Object} - The standard request object.
 */
const standardRequest = (type, options = {}) => {
  if (!type) throw new Error('HTTP method type is required');

  if (!options || typeof options !== 'object') throw new Error('Request options must be an object');

  if (
    !Object.prototype.hasOwnProperty.call(options, 'tags') ||
    !Array.isArray(options.tags) ||
    options.tags.length === 0
  ) {
    throw new Error('Request tags are required');
  }

  if (!Object.prototype.hasOwnProperty.call(options, 'operationId') || !options.operationId) {
    throw new Error('Request operationId is required');
  }

  let requestObject = {};

  requestObject[type.toLowerCase()] = { ...options };

  return requestObject;
};

module.exports = { standardRequest };
