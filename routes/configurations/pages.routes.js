// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const pagesSchemas = require('./validations/pages.validations');
const pagesController = require('../../controllers/configurations/pages.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(pagesSchemas.createPageSchema),
  validationErrorHandler,
  pagesController.createPage
);

router.patch(
  '/',
  checkSchemaWithRegistry(pagesSchemas.updatePagesStatusSchema),
  validationErrorHandler,
  pagesController.updatePagesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(pagesSchemas.getListPagesSchema),
  validationErrorHandler,
  pagesController.getListPages
);

router.get(
  '/:id',
  checkSchemaWithRegistry(pagesSchemas.getPageDetailsSchema),
  validationErrorHandler,
  pagesController.getPageDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(pagesSchemas.updatePageSchema),
  validationErrorHandler,
  pagesController.updatePage
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(pagesSchemas.deletePageSchema),
  validationErrorHandler,
  pagesController.deletePage
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
