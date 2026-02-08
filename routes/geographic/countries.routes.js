// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const countriesSchemas = require('./validations/countries.validations');
const countriesController = require('../../controllers/geographic/countries.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(countriesSchemas.createCountrySchema),
  validationErrorHandler,
  countriesController.createCountry
);

router.patch(
  '/',
  checkSchemaWithRegistry(countriesSchemas.updateCountriesStatusSchema),
  validationErrorHandler,
  countriesController.updateCountriesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(countriesSchemas.getListCountriesSchema),
  validationErrorHandler,
  countriesController.getListCountries
);

router.get(
  '/:id',
  checkSchemaWithRegistry(countriesSchemas.getCountryDetailsSchema),
  validationErrorHandler,
  countriesController.getCountryDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(countriesSchemas.updateCountrySchema),
  validationErrorHandler,
  countriesController.updateCountry
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(countriesSchemas.deleteCountrySchema),
  validationErrorHandler,
  countriesController.deleteCountry
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
