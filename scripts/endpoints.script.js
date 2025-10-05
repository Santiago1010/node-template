// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const expressEndpoints = require('express-list-endpoints'); // Express route introspection utility

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const app = require('../app'); // Main Express application instance
const sequelize = require('../config/database/connection'); // Database connection and models
const { getRegisteredSchemas } = require('../utils/validationRegistry.util'); // Validation schema registry

// Sequelize models for configuration storage
const { configEndpoints, configEndpointsRequestSchema, configSecurityLevels } = sequelize.models;

/**
 * Extracts validation schema from Express route middleware
 *
 * @description Traverses route middleware stack to locate and extract validation schemas
 *              from express-validator compatible middleware functions. Uses mock request
 *              objects to trigger schema capture without actual HTTP requests.
 *
 * @param {Object} route - Express route object containing middleware stack
 * @param {string} basePath - Base path prefix for nested routers
 * @returns {Object|null} Extracted validation schema or null if not found
 *
 * @example
 * // Extract schema from a route with validation middleware
 * const route = app._router.stack.find(layer => layer.route);
 * const schema = extractSchemaFromRoute(route.route);
 *
 * @complexity Time: O(n) where n=route middleware layers
 * @since Version 1.0.0
 * @see {@link processStack} for recursive router traversal
 */
const extractSchemaFromRoute = (route, basePath = '') => {
  if (!route.stack) return null;

  // Iterate through route middleware layers
  for (const layer of route.stack) {
    // Look for express-validator compatible middleware (typically named 'captureMiddleware')
    if (layer.name === 'captureMiddleware' && layer.handle.length === 3) {
      const mockReq = {
        route: route,
        baseUrl: basePath,
      };

      try {
        // Attempt to trigger schema extraction using mock objects
        // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
        layer.handle(mockReq, {}, () => {});
      } catch (_) {
        // Schema extraction errors are non-fatal - continue processing
        // Ignore errors during mock execution
      }
    }
  }

  return null;
};

/**
 * Recursively processes Express application middleware stack
 *
 * @description Traverses the entire Express router hierarchy to discover all registered routes.
 *              Handles both direct routes and nested routers with proper path composition.
 *              Calls extractSchemaFromRoute for each discovered route.
 *
 * @param {Array} stack - Express middleware stack array
 * @param {string} basePath - Accumulated base path for nested routers
 *
 * @example
 * // Process entire application router stack
 * processStack(app._router.stack);
 *
 * @complexity Time: O(n) where n=middleware layers, Space: O(d) where d=router depth
 * @since Version 1.0.0
 * @see {@link extractSchemaFromRoute} for individual route processing
 */
const processStack = (stack, basePath = '') => {
  stack.forEach((layer) => {
    if (layer.route) {
      // Found a direct route - extract its schema
      extractSchemaFromRoute(layer.route, basePath);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Found a nested router - recursively process with updated base path
      const routerPathRegex = /^\\\/([^\\\/\?]+)/;
      const routerMatch = layer.regexp.source.match(routerPathRegex);
      const routerPath = routerMatch?.[1] || '';
      const newBasePath = basePath + routerPath;

      processStack(layer.handle.stack, newBasePath);
    }
  });
};

/**
 * Parses endpoint path into structured components
 *
 * @description Deconstructs API paths following the pattern /api/{platform}/{version}/{group}/{path}
 *              into discrete components for organized storage and querying.
 *
 * @param {string} fullPath - Complete endpoint path (e.g., '/api/mobile/v1/users/profile')
 * @returns {Object} Structured path components
 *
 * @example
 * // Parse complex API path
 * const components = parseEndpointPath('/api/web/v2/products/search');
 * // Returns: { platform: 'web', version: 'v2', group: 'products', path: '/search' }
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const parseEndpointPath = (fullPath) => {
  const regex = /^\/api\/([^\/]+)\/([^\/]+)\/([^\/]+)(.*)$/;
  const match = fullPath.match(regex);

  if (!match) {
    // Return fallback structure for non-conforming paths
    return {
      platform: null,
      version: null,
      group: null,
      path: fullPath,
    };
  }

  return {
    platform: match[1], // e.g., 'mobile', 'web', 'admin'
    version: match[2], // e.g., 'v1', 'v2', 'beta'
    group: match[3], // e.g., 'users', 'products', 'orders'
    path: match[4] || '/', // Remaining path segment
  };
};

/**
 * Maps validation schema types to database-compatible data types
 *
 * @description Analyzes express-validator field schemas to determine appropriate database types
 *              based on validation rules and type conversions present in the schema.
 *
 * @param {Object} fieldSchema - Express-validator field validation schema
 * @returns {string} Database-compatible data type
 *
 * @example
 * // Map integer validation to database type
 * const type = mapSchemaDataType({ isInt: true }); // Returns: 'integer'
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const mapSchemaDataType = (fieldSchema) => {
  // Type detection based on validation predicates
  if (fieldSchema.isInt || fieldSchema.toInt) return 'integer';
  if (fieldSchema.isFloat || fieldSchema.toFloat) return 'float';
  if (fieldSchema.isBoolean) return 'boolean';
  if (fieldSchema.isArray) return 'array';
  if (fieldSchema.isString) return 'string';

  // Default to string for unknown types
  return 'string';
};

/**
 * Determines field requirement status from validation schema
 *
 * @description Analyzes validation rules to determine if a field is mandatory.
 *              Considers existence checks, empty value restrictions, and optional flags.
 *
 * @param {Object} fieldSchema - Express-validator field validation schema
 * @returns {boolean} True if field is required, false otherwise
 *
 * @example
 * // Check if field is required
 * const required = isFieldRequired({ exists: true, notEmpty: true }); // true
 * const optional = isFieldRequired({ optional: true }); // false
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const isFieldRequired = (fieldSchema) => {
  return !!(fieldSchema.exists || (fieldSchema.notEmpty && !fieldSchema.optional));
};

/**
 * Maps express-validator location to database enum value
 *
 * @description Converts express-validator location identifiers (body, params, query, etc.)
 *              to standardized database enum values for consistent storage.
 *
 * @param {string} location - Express-validator location identifier
 * @returns {string} Standardized location enum value
 *
 * @example
 * // Convert validation locations
 * const dbLocation = mapLocation('query'); // Returns: 'query'
 * const headerLocation = mapLocation('headers'); // Returns: 'header'
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const mapLocation = (location) => {
  const locationMap = {
    body: 'body',
    params: 'params',
    query: 'query',
    headers: 'header',
    cookies: 'header', // Cookies are stored in header location
  };

  return locationMap[location] || 'body'; // Default to body
};

/**
 * Processes nested field structures in validation schemas
 *
 * @description Recursively handles nested objects and arrays in validation schemas,
 *              creating hierarchical field relationships in the database. Supports
 *              complex nested structures with proper parent-child relationships.
 *
 * @param {string} fieldName - Name of the field being processed
 * @param {Object} fieldSchema - Validation schema for the field
 * @param {number} endpointId - Database ID of the parent endpoint
 * @param {number} securityLevelId - Database ID of the security level
 * @param {number|null} parentFieldId - Database ID of parent field for nested structures
 * @param {Object} transaction - Sequelize transaction object
 * @returns {Promise<Object>} Created or updated field record
 *
 * @example
 * // Process nested address object
 * await processNestedFields('address', addressSchema, endpointId, securityLevelId, null, transaction);
 *
 * @complexity Time: O(1) per field, Space: O(1) per field
 * @since Version 1.0.0
 * @see {@link syncValidationSchema} for the calling context
 */
const processNestedFields = async (
  fieldName,
  fieldSchema,
  endpointId,
  securityLevelId,
  parentFieldId = null,
  transaction
) => {
  const location = mapLocation(fieldSchema.in);
  const dataType = mapSchemaDataType(fieldSchema);
  const isRequired = isFieldRequired(fieldSchema);

  // Create or find field record with idempotent operation
  const [field] = await configEndpointsRequestSchema.findOrCreate({
    where: {
      endpointId,
      name: fieldName,
      location,
    },
    defaults: {
      endpointId,
      securityLevelId,
      fieldId: parentFieldId,
      name: fieldName,
      location,
      dataType,
      isRequired,
    },
    transaction,
  });

  // Update existing record if it wasn't newly created
  if (!field._options.isNewRecord) {
    await field.update(
      {
        securityLevelId,
        fieldId: parentFieldId,
        dataType,
        isRequired,
      },
      { transaction }
    );
  }

  return field;
};

/**
 * Synchronizes individual endpoint with database
 *
 * @description Creates or updates endpoint records in the configuration database.
 *              Handles both endpoint metadata and associated validation schemas.
 *              Implements idempotent operations for safe repeated execution.
 *
 * @param {Object} endpointData - Endpoint metadata and configuration
 * @param {string} endpointData.method - HTTP method (get, post, put, delete, etc.)
 * @param {string} endpointData.platform - API platform identifier
 * @param {string} endpointData.version - API version identifier
 * @param {string} endpointData.group - Endpoint group/category
 * @param {string} endpointData.path - Endpoint path within group
 * @param {boolean} endpointData.requiresAuthorization - Authorization requirement flag
 * @param {boolean} endpointData.hasSensitiveInformation - Data sensitivity flag
 * @param {Object|null} endpointData.validationSchema - Express-validator schema object
 * @param {Object} transaction - Sequelize transaction object
 * @returns {Promise<Object>} Created or updated endpoint record
 *
 * @example
 * // Sync a new endpoint
 * await syncEndpoint({
 *   method: 'post',
 *   platform: 'mobile',
 *   version: 'v1',
 *   group: 'users',
 *   path: '/create',
 *   requiresAuthorization: true,
 *   hasSensitiveInformation: false,
 *   validationSchema: userCreateSchema
 * }, transaction);
 *
 * @complexity Time: O(1) for endpoint + O(m) for schema fields
 * @since Version 1.0.0
 * @see {@link main} for the iteration context
 */
const syncEndpoint = async (endpointData, transaction) => {
  const { method, platform, version, group, path, requiresAuthorization, hasSensitiveInformation, validationSchema } =
    endpointData;

  // Idempotent endpoint creation/update
  const [endpoint, created] = await configEndpoints.findOrCreate({
    where: {
      method,
      platform,
      version,
      endpointGroup: group,
      path,
    },
    defaults: {
      method,
      platform,
      version,
      endpointGroup: group,
      path,
      requiresAuthorization,
      hasSensitiveInformation,
    },
    transaction,
  });

  // Update existing endpoint if security configuration changed
  if (!created) {
    await endpoint.update(
      {
        requiresAuthorization,
        hasSensitiveInformation,
      },
      { transaction }
    );
  }

  console.log(
    `  ${created ? '✅ Created' : '🔄 Updated'}: ${method.toUpperCase()} ${platform}/${version}/${group}${path}`
  );

  // Process validation schema if present
  if (validationSchema) {
    await syncValidationSchema(endpoint.id, validationSchema, transaction);
  }

  return endpoint;
};

/**
 * Synchronizes validation schema fields with database
 *
 * @description Processes complete validation schemas for endpoints, creating/updating
 *              field definitions and cleaning up orphaned fields. Maintains schema
 *              consistency between Express validation and database configuration.
 *
 * @param {number} endpointId - Database ID of the parent endpoint
 * @param {Object} validationSchema - Express-validator schema object
 * @param {Object} transaction - Sequelize transaction object
 *
 * @example
 * // Sync validation schema for user creation
 * await syncValidationSchema(endpointId, userCreateSchema, transaction);
 *
 * @throws {Error} When security level configuration is missing
 * @complexity Time: O(n) where n=validation fields
 * @since Version 1.0.0
 * @see {@link syncEndpoint} for the calling context
 */
const syncValidationSchema = async (endpointId, validationSchema, transaction) => {
  // Retrieve default security level for schema fields
  const defaultSecurityLevel = await configSecurityLevels.findOne({
    where: { isDefault: true },
    transaction,
  });

  if (!defaultSecurityLevel) {
    console.warn('  ⚠️  No default security level found. Skipping schema synchronization.');
    return;
  }

  const securityLevelId = defaultSecurityLevel.id;

  // Get existing fields for cleanup detection
  const existingFields = await configEndpointsRequestSchema.findAll({
    where: { endpointId },
    transaction,
  });

  const existingFieldNames = new Set(existingFields.map((f) => f.name));
  const currentFieldNames = new Set(Object.keys(validationSchema));

  // Remove fields that no longer exist in current schema
  const fieldsToDelete = existingFields.filter((f) => !currentFieldNames.has(f.name));
  for (const field of fieldsToDelete) {
    await field.destroy({ transaction });
    console.log(`    🗑️  Field deleted: ${field.name}`);
  }

  // Process each field in the current validation schema
  for (const [fieldName, fieldSchema] of Object.entries(validationSchema)) {
    await processNestedFields(fieldName, fieldSchema, endpointId, securityLevelId, null, transaction);

    const action = existingFieldNames.has(fieldName) ? 'updated' : 'created';
    console.log(`    📝 Field ${action}: ${fieldName}`);
  }
};

/**
 * Main synchronization orchestration function
 *
 * @description Coordinates the complete endpoint discovery and synchronization process.
 *              Discovers Express endpoints, extracts validation schemas, and synchronizes
 *              with database within a transaction boundary. Provides comprehensive logging
 *              and error handling.
 *
 * @returns {Promise<void>}
 *
 * @example
 * // Run complete synchronization
 * main().then(() => console.log('Sync completed')).catch(console.error);
 *
 * @throws {Error} When synchronization fails - includes database and processing errors
 * @complexity Time: O(n + m) where n=endpoints, m=total validation fields
 * @since Version 1.0.0
 */
const main = async () => {
  console.log('🚀 Starting endpoint synchronization...\n');

  try {
    // Process Express application to extract validation schemas
    processStack(app._router.stack);

    // Discover all registered Express endpoints
    const endpoints = expressEndpoints(app);
    const schemas = getRegisteredSchemas();

    // Map endpoints with their corresponding validation schemas
    const endpointsWithSchemas = endpoints.map((endpoint) => {
      const schema = schemas.find((s) => endpoint.path.includes(s.path) && endpoint.methods.includes(s.method));
      const parsedPath = parseEndpointPath(endpoint.path);
      const method = endpoint.methods[0]?.toLowerCase() || 'get';

      return {
        method,
        platform: parsedPath.platform,
        version: parsedPath.version,
        group: parsedPath.group,
        path: parsedPath.path,
        requiresAuthorization: true, // Default security configuration
        hasSensitiveInformation: true, // Default privacy configuration
        validationSchema: schema ? schema.schema : null,
      };
    });

    console.log(`📊 Total endpoints found: ${endpointsWithSchemas.length}\n`);

    // Execute synchronization within transaction for data consistency
    await sequelize.transaction(async (transaction) => {
      for (const endpointData of endpointsWithSchemas) {
        await syncEndpoint(endpointData, transaction);
      }
    });

    console.log('\n✅ Synchronization completed successfully!');

    // Display synchronization statistics
    const totalEndpoints = await configEndpoints.count();
    const totalSchemas = await configEndpointsRequestSchema.count();

    console.log(`\n📈 Statistics:`);
    console.log(`   - Endpoints in DB: ${totalEndpoints}`);
    console.log(`   - Schema fields in DB: ${totalSchemas}`);
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    throw error;
  } finally {
    // Ensure database connection is closed
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
};

// =============================================================================
// MODULE EXPORTS & EXECUTION
// =============================================================================

/**
 * Service entry point with proper process lifecycle management
 *
 * @description Executes the main synchronization process with proper exit code handling.
 *              Ensures the Node.js process exits appropriately based on success/failure.
 */
main()
  .then(() => {
    console.log('\n👋 Script finished.');
    process.exit(0); // Success exit code
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1); // Error exit code
  });
