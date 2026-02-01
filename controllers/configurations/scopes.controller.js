'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ScopesServices = require('../../services/scope.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// ScopeController
// =============================================================================

class ScopeController {
  /**
   * Creates a new scope
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created scope
   */
  static async createScope(req, res, next) {
    try {
      const { name, description, isSelectable } = req.body;
      const { actor } = req;

      const scopeService = new ScopesServices();
      await scopeService.initialize();

      const newscope = await scopeService.createScope({ name, description, isSelectable }, { actor });

      return success(res, { httpCode: 201, messagePath: 'scope.created', data: newscope });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more scopes
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateScopesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const scopeService = new ScopesServices();
      await scopeService.initialize();

      const result = await scopeService.updateScopesStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'scopes.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of scopes with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated scopes
   */
  static async getListScopes(req, res, next) {
    try {
      const scopeService = new ScopesServices();
      await scopeService.initialize();

      const result = await scopeService.getListScopes(req.query);

      return success(res, { httpCode: 200, messagePath: 'scopes.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific scope by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with scope details
   */
  static async getScopeDetails(req, res, next) {
    try {
      const { id } = req.params;

      const scopeService = new ScopesServices();
      await scopeService.initialize();

      const scope = await scopeService.getScopeDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'scope.details', data: scope });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing scope
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated scope
   */
  static async updateScope(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, isSelectable, active } = req.body;
      const { actor } = req;

      const scopeService = new ScopesServices();
      await scopeService.initialize();

      const updatedscope = await scopeService.updateScope(id, { name, description, isSelectable, active, actor });

      return success(res, { httpCode: 200, messagePath: 'scope.updated', data: updatedscope });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a scope by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteScope(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const scopeService = new ScopesServices();
      await scopeService.initialize();

      const result = await scopeService.deleteScope(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'scope.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = ScopeController;
