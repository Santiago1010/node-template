// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const currenciesSchemas = require('./validations/currencies.validations');
const currenciesController = require('../../controllers/data/currencies.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(currenciesSchemas.createCurrencySchema),
  validationErrorHandler,
  currenciesController.createCurrency
);

router.patch(
  '/',
  checkSchemaWithRegistry(currenciesSchemas.updateCurrenciesStatusSchema),
  validationErrorHandler,
  currenciesController.updateCurrenciesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(currenciesSchemas.getListCurrenciesSchema),
  validationErrorHandler,
  currenciesController.getListCurrencies
);

router.get(
  '/:id',
  checkSchemaWithRegistry(currenciesSchemas.getCurrencyDetailsSchema),
  validationErrorHandler,
  currenciesController.getCurrencyDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(currenciesSchemas.updateCurrencySchema),
  validationErrorHandler,
  currenciesController.updateCurrency
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(currenciesSchemas.deleteCurrencySchema),
  validationErrorHandler,
  currenciesController.deleteCurrency
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
