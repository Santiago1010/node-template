// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs').promises;
const path = require('path');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const expressEndpoints = require('express-list-endpoints');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const app = require('../app');
const { initializeConnection } = require('../config/database/connection');
const { getRegisteredSchemas } = require('../utils/validationRegistry.util');

/**
 * Extracts validation schema from Express route middleware
 */
const extractSchemaFromRoute = (route, basePath = '') => {
  if (!route.stack) return null;

  for (const layer of route.stack) {
    if (layer.name === 'captureMiddleware' && layer.handle.length === 3) {
      const mockReq = {
        route: route,
        baseUrl: basePath,
      };

      try {
        // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
        layer.handle(mockReq, {}, () => {});
      } catch (_) {
        // Ignore errors during mock execution
      }
    }
  }

  return null;
};

/**
 * Recursively processes Express application middleware stack
 */
const processStack = (stack, basePath = '') => {
  stack.forEach((layer) => {
    if (layer.route) {
      extractSchemaFromRoute(layer.route, basePath);
    } else if (layer.name === 'router' && layer.handle.stack) {
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
 */
const parseEndpointPath = (fullPath) => {
  const regex = /^\/api\/([^\/]+)\/([^\/]+)(.*)$/;
  const match = fullPath.match(regex);

  if (!match) {
    return {
      version: null,
      group: null,
      path: fullPath,
    };
  }

  return {
    version: match[1],
    group: match[2],
    path: match[3] || '/',
  };
};

/**
 * Maps validation schema types to database-compatible data types
 */
const mapSchemaDataType = (fieldSchema) => {
  if (fieldSchema.isInt || fieldSchema.toInt) return 'integer';
  if (fieldSchema.isFloat || fieldSchema.toFloat) return 'float';
  if (fieldSchema.isBoolean) return 'boolean';
  if (fieldSchema.isArray) return 'array';
  if (fieldSchema.isString) return 'string';

  return 'string';
};

/**
 * Determines field requirement status from validation schema
 */
const isFieldRequired = (fieldSchema) => {
  return !!(fieldSchema.exists || (fieldSchema.notEmpty && !fieldSchema.optional));
};

/**
 * Maps express-validator location to database enum value
 */
const mapLocation = (location) => {
  const locationMap = {
    body: 'body',
    params: 'params',
    query: 'query',
    headers: 'header',
    cookies: 'header',
  };

  return locationMap[location] || 'body';
};

/**
 * Processes nested field structures in validation schemas
 *
 * @param {string} fieldName - Name of the field being processed
 * @param {Object} fieldSchema - Validation schema for the field
 * @param {number} endpointId - Database ID of the parent endpoint
 * @param {number|null} parentFieldId - Database ID of parent field
 * @param {Object} transaction - Sequelize transaction object
 * @returns {Promise<Object>} Created or updated field record
 */
const processNestedFields = async (fieldName, fieldSchema, endpointId, parentFieldId = null, transaction) => {
  const sequelize = await initializeConnection();
  const { configEndpointsRequestSchema } = sequelize.models;

  const location = mapLocation(fieldSchema.in);
  const dataType = mapSchemaDataType(fieldSchema);
  const isRequired = isFieldRequired(fieldSchema);

  // Find existing field
  const existingField = await configEndpointsRequestSchema.findOne({
    where: {
      endpointId,
      name: fieldName,
      location,
    },
    transaction,
  });

  if (existingField) {
    await existingField.update(
      {
        fieldId: parentFieldId,
        dataType,
        isRequired,
      },
      { transaction }
    );

    return existingField;
  }

  // Create new field
  const [field] = await configEndpointsRequestSchema.findOrCreate({
    where: {
      endpointId,
      name: fieldName,
      location,
    },
    defaults: {
      endpointId,
      fieldId: parentFieldId,
      name: fieldName,
      location,
      dataType,
      isRequired,
    },
    transaction,
  });

  return field;
};

/**
 * Sanitizes path for file system usage
 *
 * @description Converts URL path parameters to file-safe format
 * @param {string} pathStr - Original path string
 * @returns {string} Sanitized path suitable for filenames
 *
 * @example
 * sanitizePathForFilename('/users/:idUser/details/:credential')
 * // Returns: 'users-{idUser}-details-{credential}'
 */
const sanitizePathForFilename = (pathStr) => {
  return pathStr
    .replace(/^\//, '') // Remove leading slash
    .replace(/\/$/, '') // Remove trailing slash
    .replace(/\/:([^\/]+)/g, '-{$1}') // Convert /:param to -{param}
    .replace(/\//g, '-') // Convert remaining slashes to hyphens
    .replace(/[^a-zA-Z0-9\-_{}]/g, '_'); // Replace special chars
};

/**
 * Checks if a file is empty or contains only whitespace/comments
 *
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if file is empty or doesn't exist
 */
const isFileEmpty = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    // Consider file empty if it has no content or only whitespace
    return content.trim().length === 0;
  } catch (error) {
    // If file doesn't exist, consider it "empty"
    if (error.code === 'ENOENT') {
      return true;
    }
    throw error;
  }
};

/**
 * Creates directory structure recursively
 *
 * @param {string} dirPath - Directory path to create
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

/**
 * Generates all UML diagrams for an endpoint
 *
 * @param {Object} endpointData - Endpoint information
 * @returns {Promise<void>}
 */
const generateEndpointDiagrams = async (endpointData) => {
  const { method, version, group, path: endpointPath } = endpointData;

  // Skip if missing required path components
  if (!version || !group) {
    console.log(`    ⏭️  Skipping diagram generation (incomplete path structure)`);
    return;
  }

  // Sanitize path for filename
  const sanitizedPath = sanitizePathForFilename(endpointPath);
  const filename = sanitizedPath || 'root';

  // Build directory structure
  const contextDir = path.join(process.cwd(), 'context', version, group);
  await ensureDirectoryExists(contextDir);

  // Define diagram types and their generators
  const diagramTypes = [
    { name: 'activity', generator: () => '' },
    { name: 'usecase', generator: () => '' },
    { name: 'sequence', generator: () => '' },
    { name: 'communication', generator: () => '' },
    { name: 'component', generator: () => '' },
    { name: 'dataflow', generator: () => '' },
  ];

  let diagramsCreated = 0;
  let diagramsSkipped = 0;

  for (const { name, generator } of diagramTypes) {
    const diagramPath = path.join(contextDir, `${method}.${filename}.${name}.puml`);

    // Check if file exists and is not empty
    const isEmpty = await isFileEmpty(diagramPath);

    if (!isEmpty) {
      diagramsSkipped++;
      continue;
    }

    // Generate and write diagram content
    const content = generator(endpointData);
    await fs.writeFile(diagramPath, content, 'utf-8');
    diagramsCreated++;
  }

  if (diagramsCreated > 0 || diagramsSkipped > 0) {
    console.log(`    📊 Diagrams: ${diagramsCreated} created, ${diagramsSkipped} skipped (already exist)`);
  }
};

/**
 * Synchronizes individual endpoint with database
 */
const syncEndpoint = async (endpointData, transaction) => {
  const sequelize = await initializeConnection();
  const { configEndpoints } = sequelize.models;

  const { method, version, group, path, requiresAuthorization, hasSensitiveInformation, validationSchema } =
    endpointData;

  const [endpoint, created] = await configEndpoints.findOrCreate({
    where: {
      method,
      version,
      endpointGroup: group,
      path,
    },
    defaults: {
      method,
      version,
      endpointGroup: group,
      path,
      requiresAuthorization,
      hasSensitiveInformation,
    },
    transaction,
  });

  if (!created) {
    await endpoint.update(
      {
        requiresAuthorization,
        hasSensitiveInformation,
      },
      { transaction }
    );
  }

  console.log(`  ${created ? '✅ Created' : '🔄 Updated'}: ${method.toUpperCase()} ${version}/${group}${path}`);

  if (validationSchema) {
    await syncValidationSchema(endpoint.id, validationSchema, transaction);
  }

  // Generate UML diagrams for this endpoint
  await generateEndpointDiagrams(endpointData);

  return endpoint;
};

/**
 * Synchronizes validation schema fields with database
 */
const syncValidationSchema = async (endpointId, validationSchema, transaction) => {
  const sequelize = await initializeConnection();
  const { configEndpointsRequestSchema } = sequelize.models;

  const existingFields = await configEndpointsRequestSchema.findAll({
    where: { endpointId },
    transaction,
  });

  const existingFieldNames = new Set(existingFields.map((f) => f.name));
  const currentFieldNames = new Set(Object.keys(validationSchema));

  const fieldsToDelete = existingFields.filter((f) => !currentFieldNames.has(f.name));
  for (const field of fieldsToDelete) {
    await field.destroy({ transaction });
    console.log(`    🗑️  Field deleted: ${field.name}`);
  }

  for (const [fieldName, fieldSchema] of Object.entries(validationSchema)) {
    await processNestedFields(fieldName, fieldSchema, endpointId, null, transaction);

    const action = existingFieldNames.has(fieldName) ? 'updated' : 'created';
    console.log(`    📝 Field ${action}: ${fieldName}`);
  }
};

/**
 * Main synchronization orchestration function
 */
const main = async () => {
  console.log('🚀 Starting endpoint synchronization...\n');

  const sequelize = await initializeConnection();
  const { configEndpoints, configEndpointsRequestSchema } = sequelize.models;

  try {
    processStack(app._router.stack);

    const endpoints = expressEndpoints(app);
    const schemas = getRegisteredSchemas();

    const endpointsWithSchemas = endpoints.flatMap((endpoint) => {
      const parsedPath = parseEndpointPath(endpoint.path);

      return endpoint.methods.map((method) => {
        const normalizedMethod = method.toLowerCase();
        const schema = schemas.find(
          (s) => endpoint.path.includes(s.path) && s.method.toLowerCase() === normalizedMethod
        );

        return {
          method: normalizedMethod,
          version: parsedPath.version,
          group: parsedPath.group,
          path: parsedPath.path,
          requiresAuthorization: true,
          hasSensitiveInformation: true,
          validationSchema: schema ? schema.schema : null,
        };
      });
    });

    console.log(`📊 Total endpoints found: ${endpointsWithSchemas.length}\n`);

    await sequelize.transaction(async (transaction) => {
      for (const endpointData of endpointsWithSchemas) {
        await syncEndpoint(endpointData, transaction);
      }
    });

    console.log('\n✅ Synchronization completed successfully!');

    const totalEndpoints = await configEndpoints.count();
    const totalSchemas = await configEndpointsRequestSchema.count();

    console.log(`\n📈 Statistics:`);
    console.log(`   - Endpoints in DB: ${totalEndpoints}`);
    console.log(`   - Schema fields in DB: ${totalSchemas}`);
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
};

// =============================================================================
// MODULE EXPORTS & EXECUTION
// =============================================================================
main()
  .then(() => {
    console.log('\n👋 Script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
