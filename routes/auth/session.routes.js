// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../controllers/auth/session.controller');
const { sessionSchemas } = require('./validations');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { validateWebSession } = require('../../middlewares/auth/sessionToken.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

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

router.get(
  '/sessions',
  validateWebSession,
  checkSchemaWithRegistry(sessionSchemas.getSessionsSchema),
  SessionController.getSessions
);

router.delete(
  '/session/:sessionId/revoke',
  validateWebSession,
  checkSchemaWithRegistry(sessionSchemas.revokeSessionSchema),
  validationErrorHandler,
  SessionController.revokeSession
);

router.delete(
  '/sessions/revoke-all-except-current',
  validateWebSession,
  checkSchemaWithRegistry(sessionSchemas.revokeAllSessionExceptCurrentSchema),
  validationErrorHandler,
  SessionController.revokeAllSessionExceptCurrent
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
