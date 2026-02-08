// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ConfirmationController = require('../../controllers/auth/confirmation.controller');
const { confirmationSchemas } = require('./validations');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

// =============================================================================
// ROUTES
// =============================================================================
router.patch(
  '/confirm-email/:token',
  checkSchemaWithRegistry(confirmationSchemas.confirmEmailSchema),
  validationErrorHandler,
  ConfirmationController.confirmEmail
);

router.post(
  '/resend-confirmation',
  checkSchemaWithRegistry(confirmationSchemas.sendConfirmationEmailSchema),
  validationErrorHandler,
  ConfirmationController.sendConfirmationEmail
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
