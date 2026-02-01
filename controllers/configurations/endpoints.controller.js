'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const EndpointsServices = require('../../services/endpoint.services');
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
      const { actor } = req;

      const endpointService = new EndpointsServices();
      await endpointService.initialize();

      const newendpoint = await endpointService.createEndpoint(
        { method, version, endpointGroup, path, description, requiresAuthorization, hasSensitiveInformation },
        { actor }
      );

      return success(res, { httpCode: 201, messagePath: 'endpoint.created', data: newendpoint });
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
      const { actor } = req;

      const endpointService = new EndpointsServices();
      await endpointService.initialize();

      const result = await endpointService.updateEndpointsStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'endpoints.updatedStatuses', data: result });
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
      const endpointService = new EndpointsServices();
      await endpointService.initialize();

      const result = await endpointService.getListEndpoints(req.query);

      return success(res, { httpCode: 200, messagePath: 'endpoints.list', data: result });
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

      const endpointService = new EndpointsServices();
      await endpointService.initialize();

      const endpoint = await endpointService.getEndpointDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'endpoint.details', data: endpoint });
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
      const { actor } = req;

      const endpointService = new EndpointsServices();
      await endpointService.initialize();

      const updatedendpoint = await endpointService.updateEndpoint(id, {
        method,
        version,
        endpointGroup,
        path,
        description,
        requiresAuthorization,
        hasSensitiveInformation,
        active,
        actor,
      });

      return success(res, { httpCode: 200, messagePath: 'endpoint.updated', data: updatedendpoint });
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
      const { actor } = req;

      const endpointService = new EndpointsServices();
      await endpointService.initialize();

      const result = await endpointService.deleteEndpoint(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'endpoint.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = EndpointController;
