// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const continentsSchemas = require('./validations/continents.validations');
const continentsController = require('../../controllers/geographic/continents.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(continentsSchemas.createContinentSchema),
  validationErrorHandler,
  continentsController.createContinent
);

router.patch(
  '/',
  checkSchemaWithRegistry(continentsSchemas.updateContinentsStatusSchema),
  validationErrorHandler,
  continentsController.updateContinentsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(continentsSchemas.getListContinentsSchema),
  validationErrorHandler,
  continentsController.getListContinents
);

router.get(
  '/:id',
  checkSchemaWithRegistry(continentsSchemas.getContinentDetailsSchema),
  validationErrorHandler,
  continentsController.getContinentDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(continentsSchemas.updateContinentSchema),
  validationErrorHandler,
  continentsController.updateContinent
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(continentsSchemas.deleteContinentSchema),
  validationErrorHandler,
  continentsController.deleteContinent
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
