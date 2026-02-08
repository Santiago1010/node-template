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
router.use('/cities', require('./cities.routes'));
router.use('/continents', require('./continents.routes'));
router.use('/countries', require('./countries.routes'));
router.use('/dialCodes', require('./dialcodes.routes'));
router.use('/politicalDivisions', require('./politicaldivisions.routes'));
router.use('/regions', require('./regions.routes'));

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
