// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const preferencesSchemas = require('./validations/preferences.validations');
const preferencesController = require('../../controllers/users/preferences.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(preferencesSchemas.createPreferenceSchema),
  validationErrorHandler,
  preferencesController.createPreference
);

router.patch(
  '/',
  checkSchemaWithRegistry(preferencesSchemas.updatePreferencesStatusSchema),
  validationErrorHandler,
  preferencesController.updatePreferencesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(preferencesSchemas.getListPreferencesSchema),
  validationErrorHandler,
  preferencesController.getListPreferences
);

router.get(
  '/:id',
  checkSchemaWithRegistry(preferencesSchemas.getPreferenceDetailsSchema),
  validationErrorHandler,
  preferencesController.getPreferenceDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(preferencesSchemas.updatePreferenceSchema),
  validationErrorHandler,
  preferencesController.updatePreference
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(preferencesSchemas.deletePreferenceSchema),
  validationErrorHandler,
  preferencesController.deletePreference
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
