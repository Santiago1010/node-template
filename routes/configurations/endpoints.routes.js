// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const endpointsController = require('../../controllers/configurations/endpoints.controller');
const { endpointsSchemas } = require('./validations/endpoints.validations');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(endpointsSchemas.createEndpointSchema),
  validationErrorHandler,
  endpointsController.createEndpoint
);

router.patch(
  '/',
  checkSchemaWithRegistry(endpointsSchemas.updateEndpointsStatusSchema),
  validationErrorHandler,
  endpointsController.updateEndpointsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(endpointsSchemas.getListEndpointsSchema),
  validationErrorHandler,
  endpointsController.getListEndpoints
);

router.get(
  '/:id',
  checkSchemaWithRegistry(endpointsSchemas.getEndpointDetailsSchema),
  validationErrorHandler,
  endpointsController.getEndpointDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(endpointsSchemas.updateEndpointSchema),
  validationErrorHandler,
  endpointsController.updateEndpoint
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(endpointsSchemas.deleteEndpointSchema),
  validationErrorHandler,
  endpointsController.deleteEndpoint
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
