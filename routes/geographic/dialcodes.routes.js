// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const dialcodesSchemas = require('./validations/dialcodes.validations');
const dialcodesController = require('../../controllers/geographic/dialcodes.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(dialcodesSchemas.createDial_codeSchema),
  validationErrorHandler,
  dialcodesController.createDial_code
);

router.patch(
  '/',
  checkSchemaWithRegistry(dialcodesSchemas.updateDialcodesStatusSchema),
  validationErrorHandler,
  dialcodesController.updateDialcodesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(dialcodesSchemas.getListDialcodesSchema),
  validationErrorHandler,
  dialcodesController.getListDialcodes
);

router.get(
  '/:id',
  checkSchemaWithRegistry(dialcodesSchemas.getDial_codeDetailsSchema),
  validationErrorHandler,
  dialcodesController.getDial_codeDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(dialcodesSchemas.updateDial_codeSchema),
  validationErrorHandler,
  dialcodesController.updateDial_code
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(dialcodesSchemas.deleteDial_codeSchema),
  validationErrorHandler,
  dialcodesController.deleteDial_code
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
