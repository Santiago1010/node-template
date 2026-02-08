// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const politicaldivisionsSchemas = require('./validations/politicaldivisions.validations');
const politicaldivisionsController = require('../../controllers/geographic/politicaldivisions.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(politicaldivisionsSchemas.createPolitical_divisionSchema),
  validationErrorHandler,
  politicaldivisionsController.createPolitical_division
);

router.patch(
  '/',
  checkSchemaWithRegistry(politicaldivisionsSchemas.updatePoliticaldivisionsStatusSchema),
  validationErrorHandler,
  politicaldivisionsController.updatePoliticaldivisionsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(politicaldivisionsSchemas.getListPoliticaldivisionsSchema),
  validationErrorHandler,
  politicaldivisionsController.getListPoliticaldivisions
);

router.get(
  '/:id',
  checkSchemaWithRegistry(politicaldivisionsSchemas.getPolitical_divisionDetailsSchema),
  validationErrorHandler,
  politicaldivisionsController.getPolitical_divisionDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(politicaldivisionsSchemas.updatePolitical_divisionSchema),
  validationErrorHandler,
  politicaldivisionsController.updatePolitical_division
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(politicaldivisionsSchemas.deletePolitical_divisionSchema),
  validationErrorHandler,
  politicaldivisionsController.deletePolitical_division
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
