'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ContinentsServices = require('../../services/continent.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// ContinentController
// =============================================================================

class ContinentController {
  /**
   * Creates a new continent
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created continent
   */
  static async createContinent(req, res, next) {
    try {
      const { name, abbreviation, surfaceArea } = req.body;
      const { actor } = req;

      const continentService = new ContinentsServices();
      await continentService.initialize();

      const newcontinent = await continentService.createContinent({ name, abbreviation, surfaceArea }, { actor });

      return await success(res, { httpCode: 201, messagePath: 'continent.created', data: newcontinent });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more continents
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateContinentsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const continentService = new ContinentsServices();
      await continentService.initialize();

      const result = await continentService.updateContinentsStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'continents.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of continents with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated continents
   */
  static async getListContinents(req, res, next) {
    try {
      const continentService = new ContinentsServices();
      await continentService.initialize();

      const result = await continentService.getListContinents(req.query);

      return await success(res, { httpCode: 200, messagePath: 'continents.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific continent by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with continent details
   */
  static async getContinentDetails(req, res, next) {
    try {
      const { id } = req.params;

      const continentService = new ContinentsServices();
      await continentService.initialize();

      const continent = await continentService.getContinentDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'continent.details', data: continent });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing continent
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated continent
   */
  static async updateContinent(req, res, next) {
    try {
      const { id } = req.params;
      const { name, abbreviation, surfaceArea, active } = req.body;
      const { actor } = req;

      const continentService = new ContinentsServices();
      await continentService.initialize();

      const updatedcontinent = await continentService.updateContinent(id, {
        name,
        abbreviation,
        surfaceArea,
        active,
        actor,
      });

      return await success(res, { httpCode: 200, messagePath: 'continent.updated', data: updatedcontinent });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a continent by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteContinent(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const continentService = new ContinentsServices();
      await continentService.initialize();

      const result = await continentService.deleteContinent(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'continent.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = ContinentController;
