'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SecuritylevelsServices = require('../../services/securityLevel.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// Security_levelController
// =============================================================================

class Security_levelController {
  /**
   * Creates a new security_level
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created security_level
   */
  static async createSecurity_level(req, res, next) {
    try {
      const { slug, name, priority, description, isDefault } = req.body;
      const { actor } = req;

      const securityLevelService = new SecuritylevelsServices();
      await securityLevelService.initialize();

      const newsecurity_level = await securityLevelService.createSecurity_level(
        { slug, name, priority, description, isDefault },
        { actor }
      );

      return success(res, { httpCode: 201, messagePath: 'security_level.created', data: newsecurity_level });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more securityLevels
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateSecuritylevelsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const securityLevelService = new SecuritylevelsServices();
      await securityLevelService.initialize();

      const result = await securityLevelService.updateSecuritylevelsStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'securityLevels.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of securityLevels with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated securityLevels
   */
  static async getListSecuritylevels(req, res, next) {
    try {
      const securityLevelService = new SecuritylevelsServices();
      await securityLevelService.initialize();

      const result = await securityLevelService.getListSecuritylevels(req.query);

      return success(res, { httpCode: 200, messagePath: 'securityLevels.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific security_level by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with security_level details
   */
  static async getSecurity_levelDetails(req, res, next) {
    try {
      const { id } = req.params;

      const securityLevelService = new SecuritylevelsServices();
      await securityLevelService.initialize();

      const security_level = await securityLevelService.getSecurity_levelDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'security_level.details', data: security_level });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing security_level
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated security_level
   */
  static async updateSecurity_level(req, res, next) {
    try {
      const { id } = req.params;
      const { slug, name, priority, description, isDefault, active } = req.body;
      const { actor } = req;

      const securityLevelService = new SecuritylevelsServices();
      await securityLevelService.initialize();

      const updatedsecurity_level = await securityLevelService.updateSecurity_level(id, {
        slug,
        name,
        priority,
        description,
        isDefault,
        active,
        actor,
      });

      return success(res, { httpCode: 200, messagePath: 'security_level.updated', data: updatedsecurity_level });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a security_level by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteSecurity_level(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const securityLevelService = new SecuritylevelsServices();
      await securityLevelService.initialize();

      const result = await securityLevelService.deleteSecurity_level(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'security_level.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = Security_levelController;
