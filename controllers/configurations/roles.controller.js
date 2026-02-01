'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const RolesServices = require('../../services/role.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// RoleController
// =============================================================================

class RoleController {
  /**
   * Creates a new role
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created role
   */
  static async createRole(req, res, next) {
    try {
      const { securityLevelId, name, target, isDefault } = req.body;
      const { actor } = req;

      const roleService = new RolesServices();
      await roleService.initialize();

      const newrole = await roleService.createRole({ securityLevelId, name, target, isDefault }, { actor });

      return success(res, { httpCode: 201, messagePath: 'role.created', data: newrole });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more roles
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateRolesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const roleService = new RolesServices();
      await roleService.initialize();

      const result = await roleService.updateRolesStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'roles.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of roles with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated roles
   */
  static async getListRoles(req, res, next) {
    try {
      const roleService = new RolesServices();
      await roleService.initialize();

      const result = await roleService.getListRoles(req.query);

      return success(res, { httpCode: 200, messagePath: 'roles.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific role by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with role details
   */
  static async getRoleDetails(req, res, next) {
    try {
      const { id } = req.params;

      const roleService = new RolesServices();
      await roleService.initialize();

      const role = await roleService.getRoleDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'role.details', data: role });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing role
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated role
   */
  static async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { securityLevelId, name, target, isDefault, active } = req.body;
      const { actor } = req;

      const roleService = new RolesServices();
      await roleService.initialize();

      const updatedrole = await roleService.updateRole(id, { securityLevelId, name, target, isDefault, active, actor });

      return success(res, { httpCode: 200, messagePath: 'role.updated', data: updatedrole });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a role by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const roleService = new RolesServices();
      await roleService.initialize();

      const result = await roleService.deleteRole(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'role.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = RoleController;
