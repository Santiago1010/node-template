// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');
const { checkSchema } = require('express-validator');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const SessionController = require('../../controllers/auth/sessionWeb.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post('/login', checkSchema(), validationErrorHandler, SessionController.login);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
