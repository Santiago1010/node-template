// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const scopesSchemas = require('./validations/scopes.validations');
const scopesController = require('../../controllers/configurations/scopes.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(scopesSchemas.createScopeSchema),
  validationErrorHandler,
  scopesController.createScope
);

router.patch(
  '/',
  checkSchemaWithRegistry(scopesSchemas.updateScopesStatusSchema),
  validationErrorHandler,
  scopesController.updateScopesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(scopesSchemas.getListScopesSchema),
  validationErrorHandler,
  scopesController.getListScopes
);

router.get(
  '/:id',
  checkSchemaWithRegistry(scopesSchemas.getScopeDetailsSchema),
  validationErrorHandler,
  scopesController.getScopeDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(scopesSchemas.updateScopeSchema),
  validationErrorHandler,
  scopesController.updateScope
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(scopesSchemas.deleteScopeSchema),
  validationErrorHandler,
  scopesController.deleteScope
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
