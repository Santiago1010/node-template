// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const {{SERVICE_NAME}} = require('../../services/{{GROUP_NAME}}/{{SERVICE_VARIABLE}}.services');
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

      const {{SERVICE_VARIABLE}}Service = new {{SERVICE_NAME}}();
      await {{SERVICE_VARIABLE}}Service.initialize();

      const new{{SINGULAR_NAME}} = await {{SERVICE_VARIABLE}}Service.{{CREATE_METHOD}}({{CREATE_CALL_SIGNATURE}});

      return await success(res, {httpCode: 201, messagePath: '{{SINGULAR_NAME}}.created', data: new{{SINGULAR_NAME}}});
    } catch (error) {
      return next(error);
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

      const {{SERVICE_VARIABLE}}Service = new {{SERVICE_NAME}}();
      await {{SERVICE_VARIABLE}}Service.initialize();

      const result = await {{SERVICE_VARIABLE}}Service.{{UPDATE_STATUS_METHOD}}(ids, active, { actor: req.user });

      return await success(res, {httpCode: 200, messagePath: '{{PLURAL_NAME}}.updatedStatuses', data: result});
    } catch (error) {
      return next(error);
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
      const {{SERVICE_VARIABLE}}Service = new {{SERVICE_NAME}}();
      await {{SERVICE_VARIABLE}}Service.initialize();

      const result = await {{SERVICE_VARIABLE}}Service.{{LIST_METHOD}}(req.query);

      return await success(res, {httpCode: 200, messagePath: '{{PLURAL_NAME}}.list', data: result});
    } catch (error) {
      return next(error);
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

      const {{SERVICE_VARIABLE}}Service = new {{SERVICE_NAME}}();
      await {{SERVICE_VARIABLE}}Service.initialize();

      const {{SINGULAR_NAME}} = await {{SERVICE_VARIABLE}}Service.{{DETAILS_METHOD}}({ id, ...req.query });

      return await success(res, {httpCode: 200, messagePath: '{{SINGULAR_NAME}}.details', data: {{SINGULAR_NAME}}});
    } catch (error) {
      return next(error);
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
      const { {{ALL_FIELDS}}, active } = req.body;

      const {{SERVICE_VARIABLE}}Service = new {{SERVICE_NAME}}();
      await {{SERVICE_VARIABLE}}Service.initialize();

      const updated{{SINGULAR_NAME}} = await {{SERVICE_VARIABLE}}Service.{{UPDATE_METHOD}}(
        id,
        { {{ALL_FIELDS}}, active, actor: req.user }
      );

      return await success(res, {httpCode: 200, messagePath: '{{SINGULAR_NAME}}.updated', data: updated{{SINGULAR_NAME}}});
    } catch (error) {
      return next(error);
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
      const { justification } = req.body;

      const {{SERVICE_VARIABLE}}Service = new {{SERVICE_NAME}}();
      await {{SERVICE_VARIABLE}}Service.initialize();

      const result = await {{SERVICE_VARIABLE}}Service.{{DELETE_METHOD}}(id, { justification, actor: req.user });

      return await success(res, {httpCode: 200, messagePath: '{{SINGULAR_NAME}}.deleted', data: result});
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {{CONTROLLER_NAME}};
