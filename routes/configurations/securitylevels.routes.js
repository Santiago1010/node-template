// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const securitylevelsSchemas = require('./validations/securitylevels.validations');
const securitylevelsController = require('../../controllers/configurations/securitylevels.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(securitylevelsSchemas.createSecurity_levelSchema),
  validationErrorHandler,
  securitylevelsController.createSecurity_level
);

router.patch(
  '/',
  checkSchemaWithRegistry(securitylevelsSchemas.updateSecuritylevelsStatusSchema),
  validationErrorHandler,
  securitylevelsController.updateSecuritylevelsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(securitylevelsSchemas.getListSecuritylevelsSchema),
  validationErrorHandler,
  securitylevelsController.getListSecuritylevels
);

router.get(
  '/:id',
  checkSchemaWithRegistry(securitylevelsSchemas.getSecurity_levelDetailsSchema),
  validationErrorHandler,
  securitylevelsController.getSecurity_levelDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(securitylevelsSchemas.updateSecurity_levelSchema),
  validationErrorHandler,
  securitylevelsController.updateSecurity_level
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(securitylevelsSchemas.deleteSecurity_levelSchema),
  validationErrorHandler,
  securitylevelsController.deleteSecurity_level
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
