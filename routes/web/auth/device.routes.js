// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const DeviceController = require('../../../controllers/web/auth/devices.controller');
const { deviceSchemas } = require('./validations');
const { validateWebSession } = require('../../../middlewares/auth/sessionToken.middleware');
const { validationErrorHandler } = require('../../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

// =============================================================================
// ROUTES
// =============================================================================
router.patch(
  '/verify-device/:token',
  validateWebSession,
  checkSchemaWithRegistry(deviceSchemas.confirmDeviceSchema),
  validationErrorHandler,
  DeviceController.confirmDevice
);

router.get('/devices', validateWebSession, DeviceController.readAllDevices);

router.patch(
  '/devices/:deviceId',
  validateWebSession,
  checkSchemaWithRegistry(deviceSchemas.updateDeviceSchema),
  validationErrorHandler,
  DeviceController.updateDevice
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
