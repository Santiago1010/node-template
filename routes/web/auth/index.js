// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../../controllers/web/auth/session.controller');
const { loginSchema } = require('./validations/login.validations');
const { validationErrorHandler } = require('../../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../../utils/validationRegistry.util');
const { validateWebSession } = require('../../../middlewares/auth/sessionToken.middleware');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

// =============================================================================
// ROUTES
// =============================================================================
router.post('/login', checkSchemaWithRegistry(loginSchema), validationErrorHandler, SessionController.login);

router.get('/protected', validateWebSession, SessionController.protectedTest);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
