// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const regionsSchemas = require('./validations/regions.validations');
const regionsController = require('../../controllers/geographic/regions.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(regionsSchemas.createRegionSchema),
  validationErrorHandler,
  regionsController.createRegion
);

router.patch(
  '/',
  checkSchemaWithRegistry(regionsSchemas.updateRegionsStatusSchema),
  validationErrorHandler,
  regionsController.updateRegionsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(regionsSchemas.getListRegionsSchema),
  validationErrorHandler,
  regionsController.getListRegions
);

router.get(
  '/:id',
  checkSchemaWithRegistry(regionsSchemas.getRegionDetailsSchema),
  validationErrorHandler,
  regionsController.getRegionDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(regionsSchemas.updateRegionSchema),
  validationErrorHandler,
  regionsController.updateRegion
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(regionsSchemas.deleteRegionSchema),
  validationErrorHandler,
  regionsController.deleteRegion
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
