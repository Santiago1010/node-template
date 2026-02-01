// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const shortenersSchemas = require('./validations/shorteners.validations');
const shortenersController = require('../../controllers/configurations/shorteners.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(shortenersSchemas.createShortenerSchema),
  validationErrorHandler,
  shortenersController.createShortener
);

router.patch(
  '/',
  checkSchemaWithRegistry(shortenersSchemas.updateShortenersStatusSchema),
  validationErrorHandler,
  shortenersController.updateShortenersStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(shortenersSchemas.getListShortenersSchema),
  validationErrorHandler,
  shortenersController.getListShorteners
);

router.get(
  '/:id',
  checkSchemaWithRegistry(shortenersSchemas.getShortenerDetailsSchema),
  validationErrorHandler,
  shortenersController.getShortenerDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(shortenersSchemas.updateShortenerSchema),
  validationErrorHandler,
  shortenersController.updateShortener
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(shortenersSchemas.deleteShortenerSchema),
  validationErrorHandler,
  shortenersController.deleteShortener
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
