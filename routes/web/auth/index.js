// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../../controllers/web/auth/session.controller');
const { loginSchema, logoutSchema, signupSchema } = require('./validations/login.validations');
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

router.post('/login', checkSchemaWithRegistry(loginSchema), validationErrorHandler, SessionController.login);

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
