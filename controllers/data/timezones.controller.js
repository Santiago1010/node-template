'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const TimezonesServices = require('../../services/timezone.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// TimezoneController
// =============================================================================

class TimezoneController {
  /**
   * Creates a new timezone
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created timezone
   */
  static async createTimezone(req, res, next) {
    try {
      const { idContinent, name, utc } = req.body;
      const { actor } = req;

      const timezoneService = new TimezonesServices();
      await timezoneService.initialize();

      const newtimezone = await timezoneService.createTimezone({ idContinent, name, utc }, { actor });

      return await success(res, { httpCode: 201, messagePath: 'timezone.created', data: newtimezone });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more timezones
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateTimezonesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const timezoneService = new TimezonesServices();
      await timezoneService.initialize();

      const result = await timezoneService.updateTimezonesStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'timezones.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of timezones with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated timezones
   */
  static async getListTimezones(req, res, next) {
    try {
      const timezoneService = new TimezonesServices();
      await timezoneService.initialize();

      const result = await timezoneService.getListTimezones(req.query);

      return await success(res, { httpCode: 200, messagePath: 'timezones.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific timezone by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with timezone details
   */
  static async getTimezoneDetails(req, res, next) {
    try {
      const { id } = req.params;

      const timezoneService = new TimezonesServices();
      await timezoneService.initialize();

      const timezone = await timezoneService.getTimezoneDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'timezone.details', data: timezone });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing timezone
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated timezone
   */
  static async updateTimezone(req, res, next) {
    try {
      const { id } = req.params;
      const { idContinent, name, utc, active } = req.body;
      const { actor } = req;

      const timezoneService = new TimezonesServices();
      await timezoneService.initialize();

      const updatedtimezone = await timezoneService.updateTimezone(id, { idContinent, name, utc, active, actor });

      return await success(res, { httpCode: 200, messagePath: 'timezone.updated', data: updatedtimezone });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a timezone by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteTimezone(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const timezoneService = new TimezonesServices();
      await timezoneService.initialize();

      const result = await timezoneService.deleteTimezone(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'timezone.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = TimezoneController;
