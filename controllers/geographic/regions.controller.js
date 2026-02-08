// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const RegionsServices = require('../../services/geographic/regions.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// RegionController
// =============================================================================

class RegionController {
  /**
   * Creates a new region
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created region
   */
  static async createRegion(req, res, next) {
    try {
      const { continentId, name } = req.body;

      const regionsService = new RegionsServices();
      await regionsService.initialize();

      const newregion = await regionsService.createRegion(continentId, name, { actor: req.user });

      return await success(res, { httpCode: 201, messagePath: 'region.created', data: newregion });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more regions
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateRegionsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;

      const regionsService = new RegionsServices();
      await regionsService.initialize();

      const result = await regionsService.updateRegionsStatus(ids, active, { actor: req.user });

      return await success(res, { httpCode: 200, messagePath: 'regions.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of regions with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated regions
   */
  static async getListRegions(req, res, next) {
    try {
      const regionsService = new RegionsServices();
      await regionsService.initialize();

      const result = await regionsService.getListRegions(req.query);

      return await success(res, { httpCode: 200, messagePath: 'regions.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific region by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with region details
   */
  static async getRegionDetails(req, res, next) {
    try {
      const { id } = req.params;

      const regionsService = new RegionsServices();
      await regionsService.initialize();

      const region = await regionsService.getRegionDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'region.details', data: region });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing region
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated region
   */
  static async updateRegion(req, res, next) {
    try {
      const { id } = req.params;
      const { continentId, name, active } = req.body;

      const regionsService = new RegionsServices();
      await regionsService.initialize();

      const updatedregion = await regionsService.updateRegion(id, { continentId, name, active, actor: req.user });

      return await success(res, { httpCode: 200, messagePath: 'region.updated', data: updatedregion });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a region by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteRegion(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;

      const regionsService = new RegionsServices();
      await regionsService.initialize();

      const result = await regionsService.deleteRegion(id, { justification, actor: req.user });

      return await success(res, { httpCode: 200, messagePath: 'region.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = RegionController;
