'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const DevicesServices = require('../../services/device.services');
const { success } = require('../../helpers/response.helper');

// =============================================================================
// DeviceController
// =============================================================================

class DeviceController {
  /**
   * Creates a new device
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with created device
   */
  static async createDevice(req, res, next) {
    try {
      const { accountId, fingerprint, name, type, browser, os, isTrusted, isBlocked, lastIp, lastUsedAt } = req.body;
      const { actor } = req;

      const deviceService = new DevicesServices();
      await deviceService.initialize();

      const newdevice = await deviceService.createDevice(
        { accountId, fingerprint, name, type, browser, os, isTrusted, isBlocked, lastIp, lastUsedAt },
        { actor }
      );

      return success(res, { httpCode: 201, messagePath: 'device.created', data: newdevice });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates the status (active/inactive) of one or more devices
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with operation result
   */
  static async updateDevicesStatus(req, res, next) {
    try {
      const { ids, active } = req.body;
      const { actor } = req;

      const deviceService = new DevicesServices();
      await deviceService.initialize();

      const result = await deviceService.updateDevicesStatus(ids, active, { actor });

      return success(res, { httpCode: 200, messagePath: 'devices.updatedStatuses', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves a paginated list of devices with optional filters
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with paginated devices
   */
  static async getListDevices(req, res, next) {
    try {
      const deviceService = new DevicesServices();
      await deviceService.initialize();

      const result = await deviceService.getListDevices(req.query);

      return success(res, { httpCode: 200, messagePath: 'devices.list', data: result });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Retrieves details of a specific device by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with device details
   */
  static async getDeviceDetails(req, res, next) {
    try {
      const { id } = req.params;

      const deviceService = new DevicesServices();
      await deviceService.initialize();

      const device = await deviceService.getDeviceDetails({ id, ...req.query });

      return success(res, { httpCode: 200, messagePath: 'device.details', data: device });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Updates an existing device
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with updated device
   */
  static async updateDevice(req, res, next) {
    try {
      const { id } = req.params;
      const { accountId, fingerprint, name, type, browser, os, isTrusted, isBlocked, lastIp, lastUsedAt, active } =
        req.body;
      const { actor } = req;

      const deviceService = new DevicesServices();
      await deviceService.initialize();

      const updateddevice = await deviceService.updateDevice(id, {
        accountId,
        fingerprint,
        name,
        type,
        browser,
        os,
        isTrusted,
        isBlocked,
        lastIp,
        lastUsedAt,
        active,
        actor,
      });

      return success(res, { httpCode: 200, messagePath: 'device.updated', data: updateddevice });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Deletes (soft delete) a device by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with deletion result
   */
  static async deleteDevice(req, res, next) {
    try {
      const { id } = req.params;
      const { justification } = req.body;
      const { actor } = req;

      const deviceService = new DevicesServices();
      await deviceService.initialize();

      const result = await deviceService.deleteDevice(id, { justification, actor });

      return success(res, { httpCode: 200, messagePath: 'device.deleted', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = DeviceController;
