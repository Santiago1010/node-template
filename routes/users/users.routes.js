// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const usersSchemas = require('./validations/users.validations');
const usersController = require('../../controllers/users/users.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(usersSchemas.createUserSchema),
  validationErrorHandler,
  usersController.createUser
);

router.patch(
  '/',
  checkSchemaWithRegistry(usersSchemas.updateUsersStatusSchema),
  validationErrorHandler,
  usersController.updateUsersStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(usersSchemas.getListUsersSchema),
  validationErrorHandler,
  usersController.getListUsers
);

router.get(
  '/:id',
  checkSchemaWithRegistry(usersSchemas.getUserDetailsSchema),
  validationErrorHandler,
  usersController.getUserDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(usersSchemas.updateUserSchema),
  validationErrorHandler,
  usersController.updateUser
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(usersSchemas.deleteUserSchema),
  validationErrorHandler,
  usersController.deleteUser
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
