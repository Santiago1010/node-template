'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const UsersServices = require('../../services/user.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// UserController
// =============================================================================

class UserController {
  /**
   * Creates a new user
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created user
   */
  static async createUser(req, res, next) {
    try {
      const { firstName, secondName, firstLastName, secondLastName } = req.body;
      const { actor } = req;

      const userService = new UsersServices();
      await userService.initialize();

      const newuser = await userService.createUser({ firstName, secondName, firstLastName, secondLastName }, { actor });

      return success(res, { httpCode: 201, messagePath: 'user.created', data: newuser });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more users
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateUsersStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const userService = new UsersServices();
      await userService.initialize();

      const result = await userService.updateUsersStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'users.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of users with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated users
   */
  static async getListUsers(req, res, next) {
    try {
      const userService = new UsersServices();
      await userService.initialize();

      const result = await userService.getListUsers(req.query);

      return success(res, { httpCode: 200, messagePath: 'users.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific user by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with user details
   */
  static async getUserDetails(req, res, next) {
    try {
      const { id } = req.params;

      const userService = new UsersServices();
      await userService.initialize();

      const user = await userService.getUserDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'user.details', data: user });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing user
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated user
   */
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, secondName, firstLastName, secondLastName, active } = req.body;
      const { actor } = req;

      const userService = new UsersServices();
      await userService.initialize();

      const updateduser = await userService.updateUser(id, {
        firstName,
        secondName,
        firstLastName,
        secondLastName,
        active,
        actor,
      });

      return success(res, { httpCode: 200, messagePath: 'user.updated', data: updateduser });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a user by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const userService = new UsersServices();
      await userService.initialize();

      const result = await userService.deleteUser(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'user.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = UserController;
