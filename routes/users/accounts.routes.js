// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const accountsSchemas = require('./validations/accounts.validations');
const accountsController = require('../../controllers/users/accounts.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post(
  '/',
  checkSchemaWithRegistry(accountsSchemas.createAccountSchema),
  validationErrorHandler,
  accountsController.createAccount
);

router.patch(
  '/',
  checkSchemaWithRegistry(accountsSchemas.updateAccountsStatusSchema),
  validationErrorHandler,
  accountsController.updateAccountsStatus
);

router.get(
  '/',
  checkSchemaWithRegistry(accountsSchemas.getListAccountsSchema),
  validationErrorHandler,
  accountsController.getListAccounts
);

router.get(
  '/:id',
  checkSchemaWithRegistry(accountsSchemas.getAccountDetailsSchema),
  validationErrorHandler,
  accountsController.getAccountDetails
);

router.put(
  '/:id',
  checkSchemaWithRegistry(accountsSchemas.updateAccountSchema),
  validationErrorHandler,
  accountsController.updateAccount
);

router.delete(
  '/:id',
  checkSchemaWithRegistry(accountsSchemas.deleteAccountSchema),
  validationErrorHandler,
  accountsController.deleteAccount
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
