// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const ConfirmationController = require('../../../controllers/web/auth/confirmation.controller');
const SessionController = require('../../../controllers/web/auth/session.controller');
const { sendConfirmationEmailSchema, confirmEmailSchema } = require('./validations/confirmation.validation');
const { loginSchema, logoutSchema, signupSchema } = require('./validations/session.validations');
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
router.post('/signup', checkSchemaWithRegistry(signupSchema), validationErrorHandler, SessionController.signup);

router.post(
  '/resend-confirmation',
  checkSchemaWithRegistry(sendConfirmationEmailSchema),
  validationErrorHandler,
  ConfirmationController.sendConfirmationEmail
);

router.patch(
  '/confirm-email/:token',
  checkSchemaWithRegistry(confirmEmailSchema),
  validationErrorHandler,
  ConfirmationController.confirmEmail
);

router.post('/login', checkSchemaWithRegistry(loginSchema), validationErrorHandler, SessionController.login);

router.patch('/refresh-token', validateWebSession, SessionController.refreshToken);

router.delete(
  '/logout',
  validateWebSession,
  checkSchemaWithRegistry(logoutSchema),
  validationErrorHandler,
  SessionController.logout
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
