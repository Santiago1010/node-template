'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const AccessesServices = require('../../services/access.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// AccessController
// =============================================================================

class AccessController {
  /**
   * Creates a new access
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created access
   */
  static async createAccess(req, res, next) {
    try {
      const { accountId, deviceId, idToken, expiresAt, isSafeMode } = req.body;
      const { actor } = req;

      const accessService = new AccessesServices();
      await accessService.initialize();

      const newaccess = await accessService.createAccess(
        { accountId, deviceId, idToken, expiresAt, isSafeMode },
        { actor }
      );

      return await success(res, { httpCode: 201, messagePath: 'access.created', data: newaccess });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more accesses
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateAccessesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const accessService = new AccessesServices();
      await accessService.initialize();

      const result = await accessService.updateAccessesStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'accesses.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of accesses with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated accesses
   */
  static async getListAccesses(req, res, next) {
    try {
      const accessService = new AccessesServices();
      await accessService.initialize();

      const result = await accessService.getListAccesses(req.query);

      return await success(res, { httpCode: 200, messagePath: 'accesses.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific access by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with access details
   */
  static async getAccessDetails(req, res, next) {
    try {
      const { id } = req.params;

      const accessService = new AccessesServices();
      await accessService.initialize();

      const access = await accessService.getAccessDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'access.details', data: access });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing access
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated access
   */
  static async updateAccess(req, res, next) {
    try {
      const { id } = req.params;
      const { accountId, deviceId, idToken, expiresAt, isSafeMode, active } = req.body;
      const { actor } = req;

      const accessService = new AccessesServices();
      await accessService.initialize();

      const updatedaccess = await accessService.updateAccess(id, {
        accountId,
        deviceId,
        idToken,
        expiresAt,
        isSafeMode,
        active,
        actor,
      });

      return await success(res, { httpCode: 200, messagePath: 'access.updated', data: updatedaccess });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a access by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteAccess(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const accessService = new AccessesServices();
      await accessService.initialize();

      const result = await accessService.deleteAccess(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'access.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = AccessController;
