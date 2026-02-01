'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CurrenciesServices = require('../../services/currency.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// CurrencyController
// =============================================================================

class CurrencyController {
  /**
   * Creates a new currency
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created currency
   */
  static async createCurrency(req, res, next) {
    try {
      const { name, abbreviation, symbol } = req.body;
      const { actor } = req;

      const currencyService = new CurrenciesServices();
      await currencyService.initialize();

      const newcurrency = await currencyService.createCurrency({ name, abbreviation, symbol }, { actor });

      return success(res, { httpCode: 201, messagePath: 'currency.created', data: newcurrency });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more currencies
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateCurrenciesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const currencyService = new CurrenciesServices();
      await currencyService.initialize();

      const result = await currencyService.updateCurrenciesStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'currencies.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of currencies with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated currencies
   */
  static async getListCurrencies(req, res, next) {
    try {
      const currencyService = new CurrenciesServices();
      await currencyService.initialize();

      const result = await currencyService.getListCurrencies(req.query);

      return success(res, { httpCode: 200, messagePath: 'currencies.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific currency by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with currency details
   */
  static async getCurrencyDetails(req, res, next) {
    try {
      const { id } = req.params;

      const currencyService = new CurrenciesServices();
      await currencyService.initialize();

      const currency = await currencyService.getCurrencyDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'currency.details', data: currency });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing currency
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated currency
   */
  static async updateCurrency(req, res, next) {
    try {
      const { id } = req.params;
      const { name, abbreviation, symbol, active } = req.body;
      const { actor } = req;

      const currencyService = new CurrenciesServices();
      await currencyService.initialize();

      const updatedcurrency = await currencyService.updateCurrency(id, { name, abbreviation, symbol, active, actor });

      return success(res, { httpCode: 200, messagePath: 'currency.updated', data: updatedcurrency });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a currency by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteCurrency(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const currencyService = new CurrenciesServices();
      await currencyService.initialize();

      const result = await currencyService.deleteCurrency(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'currency.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = CurrencyController;
