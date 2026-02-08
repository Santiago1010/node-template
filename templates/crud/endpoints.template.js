// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const {{PLURAL_NAME}}Schemas = require('./validations/{{PLURAL_NAME}}.validations');
const {{CONTROLLER_NAME}} = require('../../controllers/{{GROUP_NAME}}/{{PLURAL_NAME}}.controller');
const { validationErrorHandler } = require('../../middlewares/errors/validationError.middleware');
const { checkSchemaWithRegistry } = require('../../utils/validationRegistry.util');

// =============================================================================
// SET UP ROUTER
// =============================================================================
const router = express.Router();

router.post('/', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.{{CREATE_METHOD}}Schema), validationErrorHandler, {{CONTROLLER_NAME}}.{{CREATE_METHOD}});

router.patch('/', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.{{UPDATE_STATUS_METHOD}}Schema), validationErrorHandler, {{CONTROLLER_NAME}}.{{UPDATE_STATUS_METHOD}});

router.get('/', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.{{LIST_METHOD}}Schema), validationErrorHandler, {{CONTROLLER_NAME}}.{{LIST_METHOD}});

router.get('/:id', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.{{DETAILS_METHOD}}Schema), validationErrorHandler, {{CONTROLLER_NAME}}.{{DETAILS_METHOD}});

router.put('/:id', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.{{UPDATE_METHOD}}Schema), validationErrorHandler, {{CONTROLLER_NAME}}.{{UPDATE_METHOD}});

router.delete('/:id', checkSchemaWithRegistry({{PLURAL_NAME}}Schemas.{{DELETE_METHOD}}Schema), validationErrorHandler, {{CONTROLLER_NAME}}.{{DELETE_METHOD}});

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = router;
