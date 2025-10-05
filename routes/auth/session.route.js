// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../controllers/auth/sessionWeb.controller');
const { loginSchema } = require('./validations/session.validations');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post('/login/web', checkSchemaWithRegistry(loginSchema), validationErrorHandler, SessionController.loginWeb);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
