// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ConfirmationController = require('../../../controllers/web/auth/confirmation.controller');
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
  ConfirmationController.confirmDevice
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
