// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const EndpointsServices = require('../../services/configurations/endpoints.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// EndpointController
// =============================================================================

class EndpointController {
  /**
   * Creates a new endpoint
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created endpoint
   */
  static async createEndpoint(req, res, next) {
    try {
      const { method, version, endpointGroup, path, description, requiresAuthorization, hasSensitiveInformation } =
        req.body;

      const endpointsService = new EndpointsServices();
      await endpointsService.initialize();

      const newendpoint = await endpointsService.createEndpoint(method, version, endpointGroup, path, {
        description,
        requiresAuthorization,
        hasSensitiveInformation,
        actor: req.user,
      });

      return await success(res, { httpCode: 201, messagePath: 'endpoint.created', data: newendpoint });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more endpoints
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateEndpointsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;

      const endpointsService = new EndpointsServices();
      await endpointsService.initialize();

      const result = await endpointsService.updateEndpointsStatus(ids, active, { actor: req.user });

      return await success(res, { httpCode: 200, messagePath: 'endpoints.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of endpoints with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated endpoints
   */
  static async getListEndpoints(req, res, next) {
    try {
      const endpointsService = new EndpointsServices();
      await endpointsService.initialize();

      const result = await endpointsService.getListEndpoints(req.query);

      return await success(res, { httpCode: 200, messagePath: 'endpoints.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific endpoint by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with endpoint details
   */
  static async getEndpointDetails(req, res, next) {
    try {
      const { id } = req.params;

      const endpointsService = new EndpointsServices();
      await endpointsService.initialize();

      const endpoint = await endpointsService.getEndpointDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'endpoint.details', data: endpoint });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing endpoint
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated endpoint
   */
  static async updateEndpoint(req, res, next) {
    try {
      const { id } = req.params;
      const {
        method,
        version,
        endpointGroup,
        path,
        description,
        requiresAuthorization,
        hasSensitiveInformation,
        active,
      } = req.body;

      const endpointsService = new EndpointsServices();
      await endpointsService.initialize();

      const updatedendpoint = await endpointsService.updateEndpoint(id, {
        method,
        version,
        endpointGroup,
        path,
        description,
        requiresAuthorization,
        hasSensitiveInformation,
        active,
        actor: req.user,
      });

      return await success(res, { httpCode: 200, messagePath: 'endpoint.updated', data: updatedendpoint });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a endpoint by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteEndpoint(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;

      const endpointsService = new EndpointsServices();
      await endpointsService.initialize();

      const result = await endpointsService.deleteEndpoint(id, { justification, actor: req.user });

      return await success(res, { httpCode: 200, messagePath: 'endpoint.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = EndpointController;
