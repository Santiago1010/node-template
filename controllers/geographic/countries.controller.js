'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CountriesServices = require('../../services/geographic/countries.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// CountryController
// =============================================================================

class CountryController {
  /**
   * Creates a new country
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created country
   */
  static async createCountry(req, res, next) {
    try {
      const { idRegion, idCapital, idFlag, popularName, officialName, abbreviation, surfaceArea, tld } = req.body;
      const { actor } = req;

      const countryService = new CountriesServices();
      await countryService.initialize();

      const newcountry = await countryService.createCountry(
        { idRegion, idCapital, idFlag, popularName, officialName, abbreviation, surfaceArea, tld },
        { actor }
      );

      return await success(res, { httpCode: 201, messagePath: 'country.created', data: newcountry });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more countries
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateCountriesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const countryService = new CountriesServices();
      await countryService.initialize();

      const result = await countryService.updateCountriesStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'countries.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of countries with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated countries
   */
  static async getListCountries(req, res, next) {
    try {
      const countryService = new CountriesServices();
      await countryService.initialize();

      const result = await countryService.getListCountries(req.query);

      return await success(res, { httpCode: 200, messagePath: 'countries.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific country by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with country details
   */
  static async getCountryDetails(req, res, next) {
    try {
      const { id } = req.params;

      const countryService = new CountriesServices();
      await countryService.initialize();

      const country = await countryService.getCountryDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'country.details', data: country });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing country
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated country
   */
  static async updateCountry(req, res, next) {
    try {
      const { id } = req.params;
      const { idRegion, idCapital, idFlag, popularName, officialName, abbreviation, surfaceArea, tld, active } =
        req.body;
      const { actor } = req;

      const countryService = new CountriesServices();
      await countryService.initialize();

      const updatedcountry = await countryService.updateCountry(id, {
        idRegion,
        idCapital,
        idFlag,
        popularName,
        officialName,
        abbreviation,
        surfaceArea,
        tld,
        active,
        actor,
      });

      return await success(res, { httpCode: 200, messagePath: 'country.updated', data: updatedcountry });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a country by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteCountry(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const countryService = new CountriesServices();
      await countryService.initialize();

      const result = await countryService.deleteCountry(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'country.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = CountryController;
