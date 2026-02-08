'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const DialcodesServices = require('../../services/geographic/dialcodes.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// Dial_codeController
// =============================================================================

class Dial_codeController {
  /**
   * Creates a new dial_code
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created dial_code
   */
  static async createDial_code(req, res, next) {
    try {
      const { countryId, code, mask } = req.body;
      const { actor } = req;

      const dialCodeService = new DialcodesServices();
      await dialCodeService.initialize();

      const newdial_code = await dialCodeService.createDial_code({ countryId, code, mask }, { actor });

      return await success(res, { httpCode: 201, messagePath: 'dial_code.created', data: newdial_code });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more dialCodes
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateDialcodesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const dialCodeService = new DialcodesServices();
      await dialCodeService.initialize();

      const result = await dialCodeService.updateDialcodesStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'dialCodes.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of dialCodes with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated dialCodes
   */
  static async getListDialcodes(req, res, next) {
    try {
      const dialCodeService = new DialcodesServices();
      await dialCodeService.initialize();

      const result = await dialCodeService.getListDialcodes(req.query);

      return await success(res, { httpCode: 200, messagePath: 'dialCodes.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific dial_code by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with dial_code details
   */
  static async getDial_codeDetails(req, res, next) {
    try {
      const { id } = req.params;

      const dialCodeService = new DialcodesServices();
      await dialCodeService.initialize();

      const dial_code = await dialCodeService.getDial_codeDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'dial_code.details', data: dial_code });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing dial_code
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated dial_code
   */
  static async updateDial_code(req, res, next) {
    try {
      const { id } = req.params;
      const { countryId, code, mask, active } = req.body;
      const { actor } = req;

      const dialCodeService = new DialcodesServices();
      await dialCodeService.initialize();

      const updateddial_code = await dialCodeService.updateDial_code(id, { countryId, code, mask, active, actor });

      return await success(res, { httpCode: 200, messagePath: 'dial_code.updated', data: updateddial_code });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a dial_code by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteDial_code(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const dialCodeService = new DialcodesServices();
      await dialCodeService.initialize();

      const result = await dialCodeService.deleteDial_code(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'dial_code.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = Dial_codeController;
