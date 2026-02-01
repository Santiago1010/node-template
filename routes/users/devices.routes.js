// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const devicesSchemas = require('./validations/devices.validations');
const devicesController = require('../../controllers/users/devices.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(devicesSchemas.createDeviceSchema),
  validationErrorHandler,
  devicesController.createDevice
);

router.patch(
  '/',
  checkSchemaWithRegistry(devicesSchemas.updateDevicesStatusSchema),
  validationErrorHandler,
  devicesController.updateDevicesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(devicesSchemas.getListDevicesSchema),
  validationErrorHandler,
  devicesController.getListDevices
);

router.get(
  '/:id',
  checkSchemaWithRegistry(devicesSchemas.getDeviceDetailsSchema),
  validationErrorHandler,
  devicesController.getDeviceDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(devicesSchemas.updateDeviceSchema),
  validationErrorHandler,
  devicesController.updateDevice
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(devicesSchemas.deleteDeviceSchema),
  validationErrorHandler,
  devicesController.deleteDevice
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
