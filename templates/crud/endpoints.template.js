// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const {{CONTROLLER_NAME}} = require('../../controllers/common/{{PLURAL_NAME}}.controller');
const { {{PLURAL_NAME}}Schemas } = require('./validations/{{PLURAL_NAME}}.validations');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post('/', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.create), validationErrorHandler, {{CONTROLLER_NAME}}.create);

router.patch('/', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.updateStatus), validationErrorHandler, {{CONTROLLER_NAME}}.updateStatus);

router.get('/', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.list), validationErrorHandler, {{CONTROLLER_NAME}}.list);

router.get('/:identifier', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.details), validationErrorHandler, {{CONTROLLER_NAME}}.details);

router.put('/:id', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.update), validationErrorHandler, {{CONTROLLER_NAME}}.update);

router.delete('/:id', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.delete), validationErrorHandler, {{CONTROLLER_NAME}}.delete);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
