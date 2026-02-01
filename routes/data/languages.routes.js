// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const languagesSchemas = require('./validations/languages.validations');
const languagesController = require('../../controllers/data/languages.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(languagesSchemas.createLanguageSchema),
  validationErrorHandler,
  languagesController.createLanguage
);

router.patch(
  '/',
  checkSchemaWithRegistry(languagesSchemas.updateLanguagesStatusSchema),
  validationErrorHandler,
  languagesController.updateLanguagesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(languagesSchemas.getListLanguagesSchema),
  validationErrorHandler,
  languagesController.getListLanguages
);

router.get(
  '/:id',
  checkSchemaWithRegistry(languagesSchemas.getLanguageDetailsSchema),
  validationErrorHandler,
  languagesController.getLanguageDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(languagesSchemas.updateLanguageSchema),
  validationErrorHandler,
  languagesController.updateLanguage
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(languagesSchemas.deleteLanguageSchema),
  validationErrorHandler,
  languagesController.deleteLanguage
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
