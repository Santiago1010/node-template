// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const accessesSchemas = require('./validations/accesses.validations');
const accessesController = require('../../controllers/users/accesses.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(accessesSchemas.createAccessSchema),
  validationErrorHandler,
  accessesController.createAccess
);

router.patch(
  '/',
  checkSchemaWithRegistry(accessesSchemas.updateAccessesStatusSchema),
  validationErrorHandler,
  accessesController.updateAccessesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(accessesSchemas.getListAccessesSchema),
  validationErrorHandler,
  accessesController.getListAccesses
);

router.get(
  '/:id',
  checkSchemaWithRegistry(accessesSchemas.getAccessDetailsSchema),
  validationErrorHandler,
  accessesController.getAccessDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(accessesSchemas.updateAccessSchema),
  validationErrorHandler,
  accessesController.updateAccess
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(accessesSchemas.deleteAccessSchema),
  validationErrorHandler,
  accessesController.deleteAccess
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
