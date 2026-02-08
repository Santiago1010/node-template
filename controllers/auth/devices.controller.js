const ConfirmationService = require('../../services/auth/confirmation.service');
const DeviceServices = require('../../services/users/devices.services');
const { success } = require('../../helpers/response.helper');

class DeviceController {
  static async confirmDevice(req, res, next) {
    const { jti } = req.user;
    const { token } = req.params;
    const { password, rely, block } = req.body;

    try {
      const confirmationService = new ConfirmationService();
      await confirmationService.initialize();

      await confirmationService.confirmDevice(token, 'secure_device', password, jti, rely, block);

      return await success(res, { messagePath: 'auth.confirmDevice.deviceConfirmed' });
    } catch (error) {
      return next(error);
    }
  }

  static async readAllDevices(req, res, next) {
    const { accountId } = req.user;

    try {
      const deviceService = new DeviceServices();
      await deviceService.initialize();

      const devices = await deviceService.getListDevices({ accountId });

      return await success(res, { data: devices, messagePath: 'auth.readAllDevices.success' });
    } catch (error) {
      return next(error);
    }
  }

  static async updateDevice(req, res, next) {
    const { deviceId } = req.params;
    const { rely, block, active } = req.body;

    try {
      const deviceService = new DeviceServices();
      await deviceService.initialize();

      await deviceService.updateDevice(deviceId, { isTrusted: rely, isBlocked: block, active });

      return await success(res, { messagePath: 'auth.updateDevice.success' });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = DeviceController;
