// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const PasswordController = require('../../../controllers/web/auth/password.controller');
const { passwordSchemas } = require('./validations');
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
  '/change-password',
  validateWebSession,
  checkSchemaWithRegistry(passwordSchemas.changePasswordSchema),
  validationErrorHandler,
  PasswordController.changePassword
);

router.post(
  '/forgot-password',
  checkSchemaWithRegistry(passwordSchemas.fogotPasswordSchema),
  validationErrorHandler,
  PasswordController.fogotPassword
);

router.patch(
  '/recover-password/:token',
  checkSchemaWithRegistry(passwordSchemas.recoverPasswordSchema),
  validationErrorHandler,
  PasswordController.recoverPassword
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
