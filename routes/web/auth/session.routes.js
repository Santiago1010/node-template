// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../../controllers/web/auth/session.controller');
const { sessionSchemas } = require('./validations');
const { validationErrorHandler } = require('../../../middlewares/errors/validationError.middleware');
const { validateWebSession } = require('../../../middlewares/auth/sessionToken.middleware');
const { checkSchemaWithRegistry } = require('../../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

// =============================================================================
// ROUTES
// =============================================================================
router.post(
  '/signup',
  checkSchemaWithRegistry(sessionSchemas.signupSchema),
  validationErrorHandler,
  SessionController.signup
);

router.post(
  '/login',
  checkSchemaWithRegistry(sessionSchemas.loginSchema),
  validationErrorHandler,
  SessionController.login
);

router.delete(
  '/logout',
  validateWebSession,
  checkSchemaWithRegistry(sessionSchemas.logoutSchema),
  validationErrorHandler,
  SessionController.logout
);

router.patch('/refresh-token', validateWebSession, SessionController.refreshToken);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
