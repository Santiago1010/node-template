'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CitiesServices = require('../../services/city.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// CityController
// =============================================================================

class CityController {
  /**
   * Creates a new city
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created city
   */
  static async createCity(req, res, next) {
    try {
      const { idSubDivision, idTimezone, name } = req.body;
      const { actor } = req;

      const cityService = new CitiesServices();
      await cityService.initialize();

      const newcity = await cityService.createCity({ idSubDivision, idTimezone, name }, { actor });

      return success(res, { httpCode: 201, messagePath: 'city.created', data: newcity });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more cities
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateCitiesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const cityService = new CitiesServices();
      await cityService.initialize();

      const result = await cityService.updateCitiesStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'cities.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of cities with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated cities
   */
  static async getListCities(req, res, next) {
    try {
      const cityService = new CitiesServices();
      await cityService.initialize();

      const result = await cityService.getListCities(req.query);

      return success(res, { httpCode: 200, messagePath: 'cities.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific city by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with city details
   */
  static async getCityDetails(req, res, next) {
    try {
      const { id } = req.params;

      const cityService = new CitiesServices();
      await cityService.initialize();

      const city = await cityService.getCityDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'city.details', data: city });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing city
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated city
   */
  static async updateCity(req, res, next) {
    try {
      const { id } = req.params;
      const { idSubDivision, idTimezone, name, active } = req.body;
      const { actor } = req;

      const cityService = new CitiesServices();
      await cityService.initialize();

      const updatedcity = await cityService.updateCity(id, { idSubDivision, idTimezone, name, active, actor });

      return success(res, { httpCode: 200, messagePath: 'city.updated', data: updatedcity });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a city by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteCity(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const cityService = new CitiesServices();
      await cityService.initialize();

      const result = await cityService.deleteCity(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'city.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = CityController;
