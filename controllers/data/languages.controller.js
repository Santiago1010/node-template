'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LanguagesServices = require('../../services/language.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// LanguageController
// =============================================================================

class LanguageController {
  /**
   * Creates a new language
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created language
   */
  static async createLanguage(req, res, next) {
    try {
      const { idFlag, abbreviation, version, name, description, orientation, isPublic } = req.body;
      const { actor } = req;

      const languageService = new LanguagesServices();
      await languageService.initialize();

      const newlanguage = await languageService.createLanguage(
        { idFlag, abbreviation, version, name, description, orientation, isPublic },
        { actor }
      );

      return await success(res, { httpCode: 201, messagePath: 'language.created', data: newlanguage });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more languages
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateLanguagesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const languageService = new LanguagesServices();
      await languageService.initialize();

      const result = await languageService.updateLanguagesStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'languages.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of languages with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated languages
   */
  static async getListLanguages(req, res, next) {
    try {
      const languageService = new LanguagesServices();
      await languageService.initialize();

      const result = await languageService.getListLanguages(req.query);

      return await success(res, { httpCode: 200, messagePath: 'languages.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific language by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with language details
   */
  static async getLanguageDetails(req, res, next) {
    try {
      const { id } = req.params;

      const languageService = new LanguagesServices();
      await languageService.initialize();

      const language = await languageService.getLanguageDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'language.details', data: language });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing language
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated language
   */
  static async updateLanguage(req, res, next) {
    try {
      const { id } = req.params;
      const { idFlag, abbreviation, version, name, description, orientation, isPublic, active } = req.body;
      const { actor } = req;

      const languageService = new LanguagesServices();
      await languageService.initialize();

      const updatedlanguage = await languageService.updateLanguage(id, {
        idFlag,
        abbreviation,
        version,
        name,
        description,
        orientation,
        isPublic,
        active,
        actor,
      });

      return await success(res, { httpCode: 200, messagePath: 'language.updated', data: updatedlanguage });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a language by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteLanguage(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const languageService = new LanguagesServices();
      await languageService.initialize();

      const result = await languageService.deleteLanguage(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'language.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = LanguageController;
