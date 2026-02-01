// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const rolesSchemas = require('./validations/roles.validations');
const rolesController = require('../../controllers/configurations/roles.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(rolesSchemas.createRoleSchema),
  validationErrorHandler,
  rolesController.createRole
);

router.patch(
  '/',
  checkSchemaWithRegistry(rolesSchemas.updateRolesStatusSchema),
  validationErrorHandler,
  rolesController.updateRolesStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(rolesSchemas.getListRolesSchema),
  validationErrorHandler,
  rolesController.getListRoles
);

router.get(
  '/:id',
  checkSchemaWithRegistry(rolesSchemas.getRoleDetailsSchema),
  validationErrorHandler,
  rolesController.getRoleDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(rolesSchemas.updateRoleSchema),
  validationErrorHandler,
  rolesController.updateRole
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(rolesSchemas.deleteRoleSchema),
  validationErrorHandler,
  rolesController.deleteRole
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
