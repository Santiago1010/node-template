// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const citiesSchemas = require('./validations/cities.validations');
const citiesController = require('../../controllers/geographic/cities.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(citiesSchemas.createCitySchema),
  validationErrorHandler,
  citiesController.createCity
);

router.patch(
  '/',
  checkSchemaWithRegistry(citiesSchemas.updateCitiesStatusSchema),
  validationErrorHandler,
  citiesController.updateCitiesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(citiesSchemas.getListCitiesSchema),
  validationErrorHandler,
  citiesController.getListCities
);

router.get(
  '/:id',
  checkSchemaWithRegistry(citiesSchemas.getCityDetailsSchema),
  validationErrorHandler,
  citiesController.getCityDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(citiesSchemas.updateCitySchema),
  validationErrorHandler,
  citiesController.updateCity
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(citiesSchemas.deleteCitySchema),
  validationErrorHandler,
  citiesController.deleteCity
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
