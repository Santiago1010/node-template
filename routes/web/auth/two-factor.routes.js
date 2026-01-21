// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../../controllers/web/auth/session.controller');
const TwoFactorController = require('../../../controllers/web/auth/two-factor.controller');
const { twoFactorSchemas } = require('./validations');
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
router.post(
  '/verify-code',
  checkSchemaWithRegistry(twoFactorSchemas.verifyOTPSchema),
  validationErrorHandler,
  SessionController.verifyOTP
);

router.delete('/disable-2fa', validateWebSession, TwoFactorController.disable2FA);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
