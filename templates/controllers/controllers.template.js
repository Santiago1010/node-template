'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const {{SERVICE_NAME}} = require('../services/{{SERVICE_VARIABLE}}.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// {{CONTROLLER_NAME}}
// =============================================================================

class {{CONTROLLER_NAME}} {
  /**
   * Creates a new {{SINGULAR_NAME}}
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created {{SINGULAR_NAME}}
   */
  static async {{CREATE_METHOD}}(req, res, next) {
    try {
      const { {{ALL_FIELDS}} } = req.body;

      const new{{SINGULAR_NAME}} = await {{SERVICE_NAME}}.{{CREATE_METHOD}}({
        {{ALL_FIELDS}},
      });

      return success(res, {httpCode: 201, messagePath: '{{SINGULAR_NAME}}.created', data: new{{SINGULAR_NAME}}});
    } catch (error) {
      return next(error)
    }
  }

  /**
   * Updates the status (active/inactive) of one or more {{PLURAL_NAME}}
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async {{UPDATE_STATUS_METHOD}}(req, res, next) {
    try {
      const { ids, active } = req.body;

      const result = await {{SERVICE_NAME}}.{{UPDATE_STATUS_METHOD}}(ids, active);

      return success(res, {httpCode: 200, messagePath: '{{PLURAL_NAME}}.updatedStatuses', data: result});
    } catch (error) {
      return next(error)
    }
  }

  /**
   * Retrieves a paginated list of {{PLURAL_NAME}} with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated {{PLURAL_NAME}}
   */
  static async {{LIST_METHOD}}(req, res, next) {
    try {
      const result = await {{SERVICE_NAME}}.{{LIST_METHOD}}(req.query;);

      return success(res, {httpCode: 200, messagePath: '{{PLURAL_NAME}}.list', data: result});
    } catch (error) {
      return next(error)
    }
  }

  /**
   * Retrieves details of a specific {{SINGULAR_NAME}} by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with {{SINGULAR_NAME}} details
   */
  static async {{DETAILS_METHOD}}(req, res, next) {
    try {
      const { id } = req.params;

      const {{SINGULAR_NAME}} = await {{SERVICE_NAME}}.{{DETAILS_METHOD}}(id);

      return success(res, {httpCode: 200, messagePath: '{{SINGULAR_NAME}}.details', data: {{SINGULAR_NAME}}});
    } catch (error) {
      return next(error)
    }
  }

  /**
   * Updates an existing {{SINGULAR_NAME}}
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated {{SINGULAR_NAME}}
   */
  static async {{UPDATE_METHOD}}(req, res, next) {
    try {
      const { id } = req.params;
      const { {{ALL_FIELDS}} } = req.body;

      const updated{{SINGULAR_NAME}} = await {{SERVICE_NAME}}.{{UPDATE_METHOD}}(id, {
        {{ALL_FIELDS}},
      });

      return success(res, {httpCode: 200, messagePath: '{{SINGULAR_NAME}}.updated', data: updated{{SINGULAR_NAME}}});
    } catch (error) {
      return next(error)
    }
  }

  /**
   * Deletes (soft delete) a {{SINGULAR_NAME}} by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async {{DELETE_METHOD}}(req, res, next) {
    try {
      const { id } = req.params;

      const result = await {{SERVICE_NAME}}.{{DELETE_METHOD}}(id);

      return success(res, {httpCode: 200, messagePath: '{{SINGULAR_NAME}}.deleted', data: result});
    } catch (error) {
      return next(error)
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {{CONTROLLER_NAME}};
