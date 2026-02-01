// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const timezonesSchemas = require('./validations/timezones.validations');
const timezonesController = require('../../controllers/data/timezones.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(timezonesSchemas.createTimezoneSchema),
  validationErrorHandler,
  timezonesController.createTimezone
);

router.patch(
  '/',
  checkSchemaWithRegistry(timezonesSchemas.updateTimezonesStatusSchema),
  validationErrorHandler,
  timezonesController.updateTimezonesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(timezonesSchemas.getListTimezonesSchema),
  validationErrorHandler,
  timezonesController.getListTimezones
);

router.get(
  '/:id',
  checkSchemaWithRegistry(timezonesSchemas.getTimezoneDetailsSchema),
  validationErrorHandler,
  timezonesController.getTimezoneDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(timezonesSchemas.updateTimezoneSchema),
  validationErrorHandler,
  timezonesController.updateTimezone
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(timezonesSchemas.deleteTimezoneSchema),
  validationErrorHandler,
  timezonesController.deleteTimezone
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
