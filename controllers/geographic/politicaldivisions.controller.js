'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const PoliticaldivisionsServices = require('../../services/geographic/politicaldivisions.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// Political_divisionController
// =============================================================================

class Political_divisionController {
  /**
   * Creates a new political_division
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created political_division
   */
  static async createPolitical_division(req, res, next) {
    try {
      // const {  } = req.body;
      const { actor } = req;

      const politicalDivisionService = new PoliticaldivisionsServices();
      await politicalDivisionService.initialize();

      const newpolitical_division = await politicalDivisionService.createPolitical_division({}, { actor });

      return await success(res, {
        httpCode: 201,
        messagePath: 'political_division.created',
        data: newpolitical_division,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more politicalDivisions
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updatePoliticaldivisionsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const politicalDivisionService = new PoliticaldivisionsServices();
      await politicalDivisionService.initialize();

      const result = await politicalDivisionService.updatePoliticaldivisionsStatus(ids, active, { actor });

      return await success(res, {
        httpCode: 200,
        messagePath: 'politicalDivisions.updatedStatuses',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of politicalDivisions with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated politicalDivisions
   */
  static async getListPoliticaldivisions(req, res, next) {
    try {
      const politicalDivisionService = new PoliticaldivisionsServices();
      await politicalDivisionService.initialize();

      const result = await politicalDivisionService.getListPoliticaldivisions(req.query);

      return await success(res, { httpCode: 200, messagePath: 'politicalDivisions.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific political_division by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with political_division details
   */
  static async getPolitical_divisionDetails(req, res, next) {
    try {
      const { id } = req.params;

      const politicalDivisionService = new PoliticaldivisionsServices();
      await politicalDivisionService.initialize();

      const political_division = await politicalDivisionService.getPolitical_divisionDetails({ id, ...req.query });

      return await success(res, {
        httpCode: 200,
        messagePath: 'political_division.details',
        data: political_division,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing political_division
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated political_division
   */
  static async updatePolitical_division(req, res, next) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const { actor } = req;

      const politicalDivisionService = new PoliticaldivisionsServices();
      await politicalDivisionService.initialize();

      const updatedpolitical_division = await politicalDivisionService.updatePolitical_division(id, { active, actor });

      return await success(res, {
        httpCode: 200,
        messagePath: 'political_division.updated',
        data: updatedpolitical_division,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a political_division by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deletePolitical_division(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const politicalDivisionService = new PoliticaldivisionsServices();
      await politicalDivisionService.initialize();

      const result = await politicalDivisionService.deletePolitical_division(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'political_division.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = Political_divisionController;
