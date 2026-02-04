'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const AccountsServices = require('../../services/account.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// AccountController
// =============================================================================

class AccountController {
  /**
   * Creates a new account
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created account
   */
  static async createAccount(req, res, next) {
    try {
      const { userId, rolId, dialCodeId, recoveryEmail, recoveryEmailConfirmedAt, password, twoFactorEnabled } =
        req.body;
      const { actor } = req;

      const accountService = new AccountsServices();
      await accountService.initialize();

      const newaccount = await accountService.createAccount(
        { userId, rolId, dialCodeId, recoveryEmail, recoveryEmailConfirmedAt, password, twoFactorEnabled },
        { actor }
      );

      return await success(res, { httpCode: 201, messagePath: 'account.created', data: newaccount });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more accounts
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateAccountsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const accountService = new AccountsServices();
      await accountService.initialize();

      const result = await accountService.updateAccountsStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'accounts.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of accounts with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated accounts
   */
  static async getListAccounts(req, res, next) {
    try {
      const accountService = new AccountsServices();
      await accountService.initialize();

      const result = await accountService.getListAccounts(req.query);

      return await success(res, { httpCode: 200, messagePath: 'accounts.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific account by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with account details
   */
  static async getAccountDetails(req, res, next) {
    try {
      const { id } = req.params;

      const accountService = new AccountsServices();
      await accountService.initialize();

      const account = await accountService.getAccountDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'account.details', data: account });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing account
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated account
   */
  static async updateAccount(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, rolId, dialCodeId, recoveryEmail, recoveryEmailConfirmedAt, password, twoFactorEnabled, active } =
        req.body;
      const { actor } = req;

      const accountService = new AccountsServices();
      await accountService.initialize();

      const updatedaccount = await accountService.updateAccount(id, {
        userId,
        rolId,
        dialCodeId,
        recoveryEmail,
        recoveryEmailConfirmedAt,
        password,
        twoFactorEnabled,
        active,
        actor,
      });

      return await success(res, { httpCode: 200, messagePath: 'account.updated', data: updatedaccount });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a account by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteAccount(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const accountService = new AccountsServices();
      await accountService.initialize();

      const result = await accountService.deleteAccount(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'account.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = AccountController;
