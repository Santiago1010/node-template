'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const FlagsServices = require('../../services/flag.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// FlagController
// =============================================================================

class FlagController {
  /**
   * Creates a new flag
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created flag
   */
  static async createFlag(req, res, next) {
    try {
      const { name, emoji, location, flat2d, rounded2d, wave2d, flat3d, rounded3d, wave3d } = req.body;
      const { actor } = req;

      const flagService = new FlagsServices();
      await flagService.initialize();

      const newflag = await flagService.createFlag(
        { name, emoji, location, flat2d, rounded2d, wave2d, flat3d, rounded3d, wave3d },
        { actor }
      );

      return success(res, { httpCode: 201, messagePath: 'flag.created', data: newflag });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more flags
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateFlagsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const flagService = new FlagsServices();
      await flagService.initialize();

      const result = await flagService.updateFlagsStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'flags.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of flags with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated flags
   */
  static async getListFlags(req, res, next) {
    try {
      const flagService = new FlagsServices();
      await flagService.initialize();

      const result = await flagService.getListFlags(req.query);

      return success(res, { httpCode: 200, messagePath: 'flags.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific flag by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with flag details
   */
  static async getFlagDetails(req, res, next) {
    try {
      const { id } = req.params;

      const flagService = new FlagsServices();
      await flagService.initialize();

      const flag = await flagService.getFlagDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'flag.details', data: flag });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing flag
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated flag
   */
  static async updateFlag(req, res, next) {
    try {
      const { id } = req.params;
      const { name, emoji, location, flat2d, rounded2d, wave2d, flat3d, rounded3d, wave3d, active } = req.body;
      const { actor } = req;

      const flagService = new FlagsServices();
      await flagService.initialize();

      const updatedflag = await flagService.updateFlag(id, {
        name,
        emoji,
        location,
        flat2d,
        rounded2d,
        wave2d,
        flat3d,
        rounded3d,
        wave3d,
        active,
        actor,
      });

      return success(res, { httpCode: 200, messagePath: 'flag.updated', data: updatedflag });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a flag by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteFlag(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const flagService = new FlagsServices();
      await flagService.initialize();

      const result = await flagService.deleteFlag(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'flag.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = FlagController;
