// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const hostsSchemas = require('./validations/hosts.validations');
const hostsController = require('../../controllers/configurations/hosts.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(hostsSchemas.createHostSchema),
  validationErrorHandler,
  hostsController.createHost
);

router.patch(
  '/',
  checkSchemaWithRegistry(hostsSchemas.updateHostsStatusSchema),
  validationErrorHandler,
  hostsController.updateHostsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(hostsSchemas.getListHostsSchema),
  validationErrorHandler,
  hostsController.getListHosts
);

router.get(
  '/:id',
  checkSchemaWithRegistry(hostsSchemas.getHostDetailsSchema),
  validationErrorHandler,
  hostsController.getHostDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(hostsSchemas.updateHostSchema),
  validationErrorHandler,
  hostsController.updateHost
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(hostsSchemas.deleteHostSchema),
  validationErrorHandler,
  hostsController.deleteHost
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
