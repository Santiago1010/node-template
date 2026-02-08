// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

// =============================================================================
// ROUTES
// =============================================================================
router.use('/endpoints', require('./endpoints.routes'));
router.use('/hosts', require('./hosts.routes'));
router.use('/pages', require('./pages.routes'));
router.use('/roles', require('./roles.routes'));
router.use('/scopes', require('./scopes.routes'));
router.use('/shorteners', require('./shorteners.routes'));

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
