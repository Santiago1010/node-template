'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const HostsServices = require('../../services/host.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// HostController
// =============================================================================

class HostController {
  /**
   * Creates a new host
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created host
   */
  static async createHost(req, res, next) {
    try {
      const { url, isDefault } = req.body;
      const { actor } = req;

      const hostService = new HostsServices();
      await hostService.initialize();

      const newhost = await hostService.createHost({ url, isDefault }, { actor });

      return await success(res, { httpCode: 201, messagePath: 'host.created', data: newhost });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more hosts
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateHostsStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const hostService = new HostsServices();
      await hostService.initialize();

      const result = await hostService.updateHostsStatus(ids, active, { actor });

      return await success(res, { httpCode: 200, messagePath: 'hosts.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of hosts with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated hosts
   */
  static async getListHosts(req, res, next) {
    try {
      const hostService = new HostsServices();
      await hostService.initialize();

      const result = await hostService.getListHosts(req.query);

      return await success(res, { httpCode: 200, messagePath: 'hosts.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific host by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with host details
   */
  static async getHostDetails(req, res, next) {
    try {
      const { id } = req.params;

      const hostService = new HostsServices();
      await hostService.initialize();

      const host = await hostService.getHostDetails({ id, ...req.query });

      return await success(res, { httpCode: 200, messagePath: 'host.details', data: host });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing host
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated host
   */
  static async updateHost(req, res, next) {
    try {
      const { id } = req.params;
      const { url, isDefault, active } = req.body;
      const { actor } = req;

      const hostService = new HostsServices();
      await hostService.initialize();

      const updatedhost = await hostService.updateHost(id, { url, isDefault, active, actor });

      return await success(res, { httpCode: 200, messagePath: 'host.updated', data: updatedhost });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a host by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteHost(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const hostService = new HostsServices();
      await hostService.initialize();

      const result = await hostService.deleteHost(id, { justification, actor });

      return await success(res, { httpCode: 200, messagePath: 'host.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = HostController;
