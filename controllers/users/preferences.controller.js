'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const PreferencesServices = require('../../services/preference.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// PreferenceController
// =============================================================================

class PreferenceController {
  /**
   * Creates a new preference
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created preference
   */
  static async createPreference(req, res, next) {
    try {
      const { accountId, languageId, timezoneId, theme, whatsapp, sms, email } = req.body;
      const { actor } = req;

      const preferenceService = new PreferencesServices();
      await preferenceService.initialize();

      const newpreference = await preferenceService.createPreference(
        { accountId, languageId, timezoneId, theme, whatsapp, sms, email },
        { actor }
      );

      return success(res, { httpCode: 201, messagePath: 'preference.created', data: newpreference });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more preferences
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updatePreferencesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const preferenceService = new PreferencesServices();
      await preferenceService.initialize();

      const result = await preferenceService.updatePreferencesStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'preferences.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of preferences with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated preferences
   */
  static async getListPreferences(req, res, next) {
    try {
      const preferenceService = new PreferencesServices();
      await preferenceService.initialize();

      const result = await preferenceService.getListPreferences(req.query);

      return success(res, { httpCode: 200, messagePath: 'preferences.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific preference by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with preference details
   */
  static async getPreferenceDetails(req, res, next) {
    try {
      const { id } = req.params;

      const preferenceService = new PreferencesServices();
      await preferenceService.initialize();

      const preference = await preferenceService.getPreferenceDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'preference.details', data: preference });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing preference
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated preference
   */
  static async updatePreference(req, res, next) {
    try {
      const { id } = req.params;
      const { accountId, languageId, timezoneId, theme, whatsapp, sms, email, active } = req.body;
      const { actor } = req;

      const preferenceService = new PreferencesServices();
      await preferenceService.initialize();

      const updatedpreference = await preferenceService.updatePreference(id, {
        accountId,
        languageId,
        timezoneId,
        theme,
        whatsapp,
        sms,
        email,
        active,
        actor,
      });

      return success(res, { httpCode: 200, messagePath: 'preference.updated', data: updatedpreference });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a preference by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deletePreference(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const preferenceService = new PreferencesServices();
      await preferenceService.initialize();

      const result = await preferenceService.deletePreference(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'preference.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = PreferenceController;
