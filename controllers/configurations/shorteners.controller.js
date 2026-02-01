'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ShortenersServices = require('../../services/shortener.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// ShortenerController
// =============================================================================

class ShortenerController {
  /**
   * Creates a new shortener
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created shortener
   */
  static async createShortener(req, res, next) {
    try {
      const { url, codeShortener, expiresAt } = req.body;
      const { actor } = req;

      const shortenerService = new ShortenersServices();
      await shortenerService.initialize();

      const newshortener = await shortenerService.createShortener({ url, codeShortener, expiresAt }, { actor });

      return success(res, { httpCode: 201, messagePath: 'shortener.created', data: newshortener });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more shorteners
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateShortenersStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const shortenerService = new ShortenersServices();
      await shortenerService.initialize();

      const result = await shortenerService.updateShortenersStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'shorteners.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of shorteners with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated shorteners
   */
  static async getListShorteners(req, res, next) {
    try {
      const shortenerService = new ShortenersServices();
      await shortenerService.initialize();

      const result = await shortenerService.getListShorteners(req.query);

      return success(res, { httpCode: 200, messagePath: 'shorteners.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific shortener by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with shortener details
   */
  static async getShortenerDetails(req, res, next) {
    try {
      const { id } = req.params;

      const shortenerService = new ShortenersServices();
      await shortenerService.initialize();

      const shortener = await shortenerService.getShortenerDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'shortener.details', data: shortener });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing shortener
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated shortener
   */
  static async updateShortener(req, res, next) {
    try {
      const { id } = req.params;
      const { url, codeShortener, expiresAt, active } = req.body;
      const { actor } = req;

      const shortenerService = new ShortenersServices();
      await shortenerService.initialize();

      const updatedshortener = await shortenerService.updateShortener(id, {
        url,
        codeShortener,
        expiresAt,
        active,
        actor,
      });

      return success(res, { httpCode: 200, messagePath: 'shortener.updated', data: updatedshortener });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a shortener by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteShortener(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const shortenerService = new ShortenersServices();
      await shortenerService.initialize();

      const result = await shortenerService.deleteShortener(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'shortener.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = ShortenerController;
