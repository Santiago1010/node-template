// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../../controllers/web/auth/session.controller');
const { twoFactorSchemas } = require('./validations');
const { validationErrorHandler } = require('../../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

// =============================================================================
// ROUTES
// =============================================================================
router.post(
  '/verify-code',
  checkSchemaWithRegistry(twoFactorSchemas.verifyOTPSchema),
  validationErrorHandler,
  SessionController.verifyOTP
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
