// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
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
router.get('/get-2fa-status', validateWebSession, TwoFactorController.get2FAStatus);

router.patch(
  '/enable-2fa',
  validateWebSession,
  checkSchemaWithRegistry(twoFactorSchemas.enable2FASchema),
  validationErrorHandler,
  TwoFactorController.enable2FA
);

router.post(
  '/send-verify-code',
  validateWebSession,
  checkSchemaWithRegistry(twoFactorSchemas.sendVerifyCodeSchema),
  validationErrorHandler,
  TwoFactorController.sendVerifyCode
);

router.post(
  '/verify-code',
  validateWebSession,
  checkSchemaWithRegistry(twoFactorSchemas.verifyOTPSchema),
  validationErrorHandler,
  TwoFactorController.verifyOTP
);

router.delete('/disable-2fa', validateWebSession, TwoFactorController.disable2FA);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
