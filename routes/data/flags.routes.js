// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const flagsSchemas = require('./validations/flags.validations');
const flagsController = require('../../controllers/data/flags.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(flagsSchemas.createFlagSchema),
  validationErrorHandler,
  flagsController.createFlag
);

router.patch(
  '/',
  checkSchemaWithRegistry(flagsSchemas.updateFlagsStatusSchema),
  validationErrorHandler,
  flagsController.updateFlagsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(flagsSchemas.getListFlagsSchema),
  validationErrorHandler,
  flagsController.getListFlags
);

router.get(
  '/:id',
  checkSchemaWithRegistry(flagsSchemas.getFlagDetailsSchema),
  validationErrorHandler,
  flagsController.getFlagDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(flagsSchemas.updateFlagSchema),
  validationErrorHandler,
  flagsController.updateFlag
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(flagsSchemas.deleteFlagSchema),
  validationErrorHandler,
  flagsController.deleteFlag
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
