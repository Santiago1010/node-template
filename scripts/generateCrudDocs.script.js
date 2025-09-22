#!/usr/bin/env node
'use strict';

// =============================================================================
// CRUD DOCUMENTATION GENERATOR - Automatic OpenAPI/Swagger Documentation
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Automatically generates OpenAPI documentation for CRUD endpoints
// - Introspects Sequelize models to extract field definitions and constraints
// - Creates standardized documentation for POST, PATCH, GET, PUT, DELETE operations
// - Supports relationship detection and proper schema references
// - Generates faker-based examples and validation rules
//
// ARCHITECTURAL DECISIONS:
// - Model-driven approach: documentation follows database schema structure
// - Template-based generation for consistency across all endpoints
// - Modular design with separation between introspection and documentation generation
// - Factory pattern for creating endpoint-specific documentation objects
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n*m) where n=models, m=average fields per model
// - Space complexity: O(n) for storing model metadata
// - Batch processing for multiple models with progress tracking
// - Efficient memory usage through streaming template generation
//
// USAGE EXAMPLES:
// - Generate all models: node generateCrudDocs.js
// - Specific model: node generateCrudDocs.js -m UserModel
// - By prefix: node generateCrudDocs.js -p auth
// - Pattern matching: node generateCrudDocs.js -pattern settings
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================const moment = require('moment');
const moment = require('moment');
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CrudHelper = require('../helpers/crud.helper');
const { docsRequest } = require('../helpers/docs-generator.helper');
const {
  activeBody,
  activeParams,
  commonListParams,
  detailsParams,
  identifierParam,
} = require('../schemas/params/common.params');
const { toCamelCase } = require('../helpers/strings.helper');
const sequelize = require('../config/database/connection');
const { Sequelize } = require('sequelize');

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Data type mapping from Sequelize to OpenAPI types with faker generators
 */
const TYPE_MAPPINGS = Object.freeze({
  // String types
  STRING: {
    type: 'string',
    generator: () => faker.lorem.word(),
  },
  TEXT: {
    type: 'string',
    generator: () => faker.lorem.paragraph(),
  },
  CHAR: {
    type: 'string',
    generator: () => faker.lorem.word(),
  },

  // Numeric types
  INTEGER: {
    type: 'integer',
    generator: () => faker.number.int({ min: 1, max: 1000 }),
  },
  BIGINT: {
    type: 'integer',
    format: 'int64',
    generator: () => faker.number.int({ min: 1, max: 999999 }),
  },
  FLOAT: {
    type: 'number',
    format: 'float',
    generator: () => faker.number.float({ min: 0, max: 1000, precision: 2 }),
  },
  DOUBLE: {
    type: 'number',
    format: 'double',
    generator: () => faker.number.float({ min: 0, max: 1000, precision: 2 }),
  },
  DECIMAL: {
    type: 'number',
    generator: () => faker.number.float({ min: 0, max: 1000, precision: 2 }),
  },

  // Boolean types
  BOOLEAN: {
    type: 'boolean',
    generator: () => faker.datatype.boolean(),
  },

  // Date/Time types
  DATE: {
    type: 'string',
    format: 'date-time',
    generator: () => moment().format(),
  },
  DATEONLY: {
    type: 'string',
    format: 'date',
    generator: () => moment().format('YYYY-MM-DD'),
  },
  TIME: {
    type: 'string',
    format: 'time',
    generator: () => moment().format('HH:mm:ss'),
  },

  // Binary types
  BLOB: {
    type: 'string',
    format: 'binary',
    generator: () => 'base64-encoded-data',
  },

  // JSON types
  JSON: {
    type: 'object',
    generator: () => ({ key: faker.lorem.word(), value: faker.lorem.sentence() }),
  },
  JSONB: {
    type: 'object',
    generator: () => ({ key: faker.lorem.word(), value: faker.lorem.sentence() }),
  },

  // Enum types
  ENUM: {
    type: 'string',
    generator: (values) => (values ? faker.helpers.arrayElement(values) : faker.lorem.word()),
  },

  // UUID types
  UUID: {
    type: 'string',
    format: 'uuid',
    generator: () => faker.string.uuid(),
  },
});

/**
 * Field types that should be excluded from creation/update operations
 */
const EXCLUDED_FIELDS = Object.freeze(
  new Set(['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt'])
);

/**
 * CLI configuration
 */
const CLI_CONFIG = Object.freeze({
  flags: {
    table: '-t',
    group: '-g',
    output: '-o',
    help: '-h',
    verbose: '-v',
  },
  help: `
CRUD Documentation Generator - Automatically generate OpenAPI docs from database table

Usage: node generateCrudDocs.js [options]

Options:
  -t <table>     Table name (required)
  -g <group>     Group name for documentation organization (required)
  -o <path>      Output directory (default: ./docs/endpoints)
  -v             Verbose logging
  -h             Show this help message

Examples:
  node generateCrudDocs.js -t auth_users -g auth         # Generate docs for auth_users table
  node generateCrudDocs.js -t content_posts -g content   # Generate docs for content_posts table
  node generateCrudDocs.js -t config_settings -g config  # Generate docs for config_settings table
`,
});

// =============================================================================
// MODEL INTROSPECTION CLASS
// =============================================================================

/**
 * Model Introspector - Analyzes Sequelize models to extract documentation metadata
 */
class ModelIntrospector extends CrudHelper {
  constructor(tableName) {
    super();
    this.tableName = tableName;
    this.modelName = toCamelCase(tableName);
    this.entityName = this.#extractEntityName(tableName);
    this.singularForm = this.#deriveSingularForm(tableName);
  }

  /**
   * Extract entity name from table name (removes prefix)
   */
  #extractEntityName(tableName) {
    const parts = tableName.split('_');
    return parts.slice(1).join('_');
  }

  /**
   * Derive singular form from table name
   */
  #deriveSingularForm() {
    const entityName = this.entityName;

    if (entityName.endsWith('ies')) {
      return entityName.slice(0, -3) + 'y';
    }
    if (entityName.endsWith('s')) {
      return entityName.slice(0, -1);
    }
    return entityName;
  }

  /**
   * Get comprehensive model metadata for documentation generation
   */
  async getModelMetadata() {
    const [allColumns, requiredColumns, nullableColumns, foreignKeys, references, bridges, enums] = await Promise.all([
      this.readAllColumns(this.tableName),
      this.readRequiredColumns(this.tableName),
      this.readNullableOrDefaultColumns(this.tableName),
      this.searchForeignKeys(this.tableName),
      this.searchReferences(this.tableName),
      this.searchBridges(this.tableName),
      this.searchEnums(this.tableName),
    ]);

    const fieldDetails = await this.#getFieldDetails(allColumns.columns);
    const tableComment = await this.readTablesComment(this.tableName);

    return {
      tableName: this.tableName,
      modelName: this.modelName,
      entityName: this.entityName,
      singularForm: this.singularForm,
      groupName: this.groupName,
      tableComment,
      fields: fieldDetails,
      requiredFields: new Set(requiredColumns.formatedColumns),
      nullableFields: new Set(nullableColumns.formatedColumns),
      relationships: {
        foreignKeys,
        references,
        bridges,
      },
      enums: enums.formatedColumns,
      hasSoftDelete: allColumns.formatedColumns.includes('deletedAt'),
    };
  }

  /**
   * Get detailed information for each field
   */
  async #getFieldDetails(columnNames) {
    const fieldDetails = {};

    for (const columnName of columnNames) {
      const details = await this.detailsColumn(this.tableName, columnName);
      const formattedName = toCamelCase(columnName);

      fieldDetails[formattedName] = {
        originalName: columnName,
        formattedName,
        ...details,
        openApiType: this.#mapToOpenApiType(details),
      };
    }

    return fieldDetails;
  }

  /**
   * Map database column type to OpenAPI type specification
   */
  #mapToOpenApiType(columnDetails) {
    const { COLUMN_TYPE } = columnDetails;
    const [baseType, sizeInfo] = COLUMN_TYPE.split('(');

    // Handle ENUM types specially
    if (baseType === 'enum') {
      const enumValues = this.#parseEnumValues(COLUMN_TYPE);
      return {
        type: 'string',
        enum: enumValues,
        generator: () => faker.helpers.arrayElement(enumValues),
      };
    }

    // Handle TINYINT(1) as BOOLEAN
    if (baseType === 'tinyint' && sizeInfo && sizeInfo.startsWith('1')) {
      return {
        type: 'boolean',
        generator: () => faker.datatype.boolean(),
      };
    }

    // Handle size-specific types
    if (baseType === 'varchar' || baseType === 'char') {
      const maxLength = this.#extractMaxLength(COLUMN_TYPE);
      return {
        type: 'string',
        maxLength,
        generator: () => faker.lorem.word({ length: { min: 1, max: Math.min(maxLength || 50, 50) } }),
      };
    }

    // Handle integer types
    if (baseType === 'int' || baseType === 'integer') {
      return {
        type: 'integer',
        generator: () => faker.number.int({ min: 1, max: 1000 }),
      };
    }

    // Map to standard types
    const mappedType = TYPE_MAPPINGS[baseType.toUpperCase()] || TYPE_MAPPINGS.STRING;
    return { ...mappedType };
  }

  /**
   * Parse ENUM values from column type definition
   */
  #parseEnumValues(columnType) {
    const valuesString = columnType.split('(')[1].replace(')', '');
    return valuesString.split(',').map((value) => value.replace(/'/g, '').trim());
  }

  /**
   * Extract maximum length from column type
   */
  #extractMaxLength(columnType) {
    const match = columnType.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
  }
}

// =============================================================================
// DOCUMENTATION GENERATOR CLASS
// =============================================================================

/**
 * CRUD Documentation Generator - Creates OpenAPI documentation for CRUD operations
 */
class CrudDocumentationGenerator {
  constructor(modelMetadata) {
    this.metadata = modelMetadata;
  }

  /**
   * Generate complete CRUD documentation
   */
  generateCrudDocs() {
    const basePath = this.#generateBasePath();
    const pathWithId = this.#generatePathWithId();

    return {
      basePath,
      pathWithId,
      metadata: this.metadata,
    };
  }

  /**
   * Generate base path operations (POST, PATCH, GET list)
   */
  #generateBasePath() {
    const create = this.#generateCreateEndpoint();
    const toggle = this.#generateToggleEndpoint();
    const list = this.#generateListEndpoint();

    return { ...create, ...toggle, ...list };
  }

  /**
   * Generate path with ID operations (GET details, PUT update, DELETE)
   */
  #generatePathWithId() {
    const details = this.#generateDetailsEndpoint();
    const update = this.#generateUpdateEndpoint();
    const remove = this.#generateDeleteEndpoint();

    return { ...details, ...update, ...remove };
  }

  /**
   * Generate POST (create) endpoint documentation
   */
  #generateCreateEndpoint() {
    const schema = this.#generateCreateSchema();

    return docsRequest('post', {
      tags: [this.metadata.entityName],
      description: `Create a new ${this.metadata.singularForm}`,
      operationId: 'create',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema },
        },
      },
      responses: this.#generateStandardResponses('create'),
      security: [{ bearerAuth: [] }],
    });
  }

  /**
   * Generate PATCH (toggle status) endpoint documentation
   */
  #generateToggleEndpoint() {
    return docsRequest('patch', {
      tags: [this.metadata.entityName],
      description: `Toggle active status of ${this.metadata.entityName}`,
      operationId: 'toggle',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['ids'],
              properties: {
                ids: {
                  type: 'array',
                  items: { type: 'integer' },
                  description: '**[Required]** Array of IDs to toggle',
                  minItems: 1,
                  example: [1, 2, 3],
                },
                ...activeBody,
              },
            },
          },
        },
      },
      responses: this.#generateStandardResponses('toggle'),
      security: [{ bearerAuth: [] }],
    });
  }

  /**
   * Generate GET (list) endpoint documentation
   */
  #generateListEndpoint() {
    return docsRequest('get', {
      tags: [this.metadata.entityName],
      description: `Get list of ${this.metadata.entityName}`,
      operationId: 'list',
      parameters: [...commonListParams, ...activeParams],
      responses: this.#generateStandardResponses('list'),
      security: [{ bearerAuth: [] }],
    });
  }

  /**
   * Generate GET (details) endpoint documentation
   */
  #generateDetailsEndpoint() {
    return docsRequest('get', {
      tags: [this.metadata.entityName],
      description: `Get details of a specific ${this.metadata.singularForm}`,
      operationId: 'details',
      parameters: [...detailsParams],
      responses: this.#generateStandardResponses('details'),
      security: [{ bearerAuth: [] }],
    });
  }

  /**
   * Generate PUT (update) endpoint documentation
   */
  #generateUpdateEndpoint() {
    const schema = this.#generateUpdateSchema();

    return docsRequest('put', {
      tags: [this.metadata.entityName],
      description: `Update a ${this.metadata.singularForm}`,
      operationId: 'update',
      parameters: [...identifierParam],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema },
        },
      },
      responses: this.#generateStandardResponses('update'),
      security: [{ bearerAuth: [] }],
    });
  }

  /**
   * Generate DELETE endpoint documentation
   */
  #generateDeleteEndpoint() {
    return docsRequest('delete', {
      tags: [this.metadata.entityName],
      description: `Delete a ${this.metadata.singularForm} permanently`,
      operationId: 'delete',
      parameters: [...identifierParam],
      responses: this.#generateStandardResponses('delete'),
      security: [{ bearerAuth: [] }],
    });
  }

  /**
   * Generate schema for create operation
   */
  #generateCreateSchema() {
    const properties = {};
    const required = [];

    for (const [fieldName, fieldInfo] of Object.entries(this.metadata.fields)) {
      if (EXCLUDED_FIELDS.has(fieldName)) continue;

      const property = this.#generateFieldProperty(fieldInfo);
      properties[fieldName] = property;

      if (this.metadata.requiredFields.has(fieldName)) {
        required.push(fieldName);
      }
    }

    return {
      type: 'object',
      required,
      properties,
    };
  }

  /**
   * Generate schema for update operation
   */
  #generateUpdateSchema() {
    const properties = {};
    const required = [];

    for (const [fieldName, fieldInfo] of Object.entries(this.metadata.fields)) {
      if (EXCLUDED_FIELDS.has(fieldName)) continue;

      const property = this.#generateFieldProperty(fieldInfo);
      properties[fieldName] = property;

      // For updates, typically fewer fields are required
      if (this.metadata.requiredFields.has(fieldName) && !fieldInfo.COLUMN_DEFAULT) {
        required.push(fieldName);
      }
    }

    return {
      type: 'object',
      required,
      properties,
    };
  }

  /**
   * Generate property definition for a field
   */
  #generateFieldProperty(fieldInfo) {
    const { openApiType, COLUMN_COMMENT, NULLABLE } = fieldInfo;
    const isRequired = !NULLABLE;
    const requiredText = isRequired ? '**[Required]** ' : '**[Optional]** ';

    const property = {
      type: openApiType.type,
      description: `${requiredText}${COLUMN_COMMENT || ''}`.trim(),
      example: openApiType.generator(),
    };

    // Add format if specified
    if (openApiType.format) {
      property.format = openApiType.format;
    }

    // Add enum values if specified
    if (openApiType.enum) {
      property.enum = openApiType.enum;
    }

    // Add length constraints
    if (openApiType.maxLength) {
      property.maxLength = openApiType.maxLength;
    }

    // Add numeric constraints
    if (openApiType.type === 'integer' || openApiType.type === 'number') {
      if (fieldInfo.COLUMN_TYPE.includes('unsigned')) {
        property.minimum = 0;
      }
    }

    return property;
  }

  /**
   * Generate standard response definitions
   */
  #generateStandardResponses(operation) {
    const responses = {
      200: {
        description: 'Success',
      },
      400: {
        description: 'Bad Request',
      },
      401: {
        description: 'Unauthorized',
      },
      500: {
        description: 'Internal Server Error',
      },
    };

    // Add operation-specific responses
    switch (operation) {
      case 'create':
        responses['201'] = {
          description: 'Created successfully',
        };
        break;
      case 'details':
        responses['404'] = {
          description: 'Not found',
        };
        break;
      case 'update':
      case 'delete':
        responses['404'] = {
          description: 'Not found',
        };
        break;
    }

    return responses;
  }
}

// =============================================================================
// FILE GENERATOR CLASS
// =============================================================================

/**
 * File Generator - Creates documentation files from generated metadata
 */
class DocumentationFileGenerator extends CrudHelper {
  constructor(outputDir = './docs/endpoints') {
    super();
    this.outputDir = outputDir;
  }

  /**
   * Generate documentation file for a model
   */
  async generateDocumentationFile(modelMetadata, crudDocs) {
    try {
      const template = await this.#getDocumentationTemplate();
      const content = this.#populateTemplate(template, modelMetadata, crudDocs);

      const folderPath = await this.#ensureOutputDirectory(modelMetadata.entityName);
      const filePath = await this.#writeDocumentationFile(folderPath, modelMetadata.modelName, content);

      return filePath;
    } catch (error) {
      console.error(`Error generating documentation file for ${modelMetadata.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get documentation template
   */
  async #getDocumentationTemplate() {
    const defaultTemplate = `// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { docsRequest } = require('../helpers/docs-generator.helper');
const {
  activeBody,
  activeParams,
  commonListParams,
  detailsParams,
  identifierParam,
} = require('../schemas/params/common.params');

// =============================================================================
// DOCS REQUESTS - {{ENTITY_NAME_UPPER}}
// =============================================================================

// ------------------------------- BASE PATH ------------------------------- //
{{BASE_PATH_CONTENT}}

// ----------------------------- PATHS WITH ID ----------------------------- //
{{PATH_WITH_ID_CONTENT}}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
const basePath = { {{BASE_PATH_EXPORTS}} };
const pathWithId = { {{PATH_WITH_ID_EXPORTS}} };

module.exports = { basePath, pathWithId };
`;

    return defaultTemplate;
  }

  /**
   * Populate template with generated documentation
   */
  #populateTemplate(template, metadata, crudDocs) {
    const { basePath, pathWithId } = crudDocs;

    // Convert documentation objects to code strings
    const basePathContent = this.#convertDocsToCode(basePath, metadata);
    const pathWithIdContent = this.#convertDocsToCode(pathWithId, metadata);

    // Generate exports
    const basePathExports = Object.keys(basePath).join(', ');
    const pathWithIdExports = Object.keys(pathWithId).join(', ');

    return template
      .replace('{{ENTITY_NAME_UPPER}}', metadata.entityName.toUpperCase())
      .replace('{{BASE_PATH_CONTENT}}', basePathContent)
      .replace('{{PATH_WITH_ID_CONTENT}}', pathWithIdContent)
      .replace('{{BASE_PATH_EXPORTS}}', basePathExports)
      .replace('{{PATH_WITH_ID_EXPORTS}}', pathWithIdExports);
  }

  /**
   * Convert documentation objects to JavaScript code
   */
  #convertDocsToCode(docsObject, metadata) {
    const codeBlocks = [];
    let getCounter = 0;

    for (const [method, config] of Object.entries(docsObject)) {
      let methodName;

      // Handle multiple GET methods (list vs details)
      if (method === 'get') {
        methodName = getCounter === 0 ? 'list' : 'details';
        getCounter++;
      } else {
        methodName = this.#getMethodName(method, metadata);
      }

      const codeBlock = `const ${methodName} = docsRequest('${method}', ${JSON.stringify(config, null, 2)});`;
      codeBlocks.push(codeBlock);
    }

    return codeBlocks.join('\n\n');
  }

  /**
   * Get method name based on HTTP method and metadata
   */
  #getMethodName(httpMethod) {
    const methodMap = {
      post: 'create',
      patch: 'toggle',
      get: 'list', // Will be overridden for details
      put: 'update',
      delete: 'remove',
    };

    return methodMap[httpMethod] || httpMethod;
  }

  /**
   * Ensure output directory exists
   */
  async #ensureOutputDirectory(entityName) {
    const folderPath = path.join(this.outputDir, entityName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    return folderPath;
  }

  /**
   * Write documentation file
   */
  async #writeDocumentationFile(folderPath, modelName, content) {
    const fileName = `${modelName}.docs.js`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }
}

// =============================================================================
// MAIN APPLICATION CLASS
// =============================================================================

/**
 * Main CRUD Documentation Generator Application
 */
class CrudDocsGeneratorApp {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './docs/endpoints';
    this.verbose = options.verbose || false;
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: null,
      endTime: null,
    };
  }

  /**
   * Main application entry point
   */
  async run(args) {
    const parsedArgs = this.#parseArguments(args);

    if (parsedArgs.help) {
      this.#showHelp();
      return;
    }

    try {
      this.stats.startTime = performance.now();
      console.log('🚀 Starting CRUD Documentation Generator...');

      const tables = await this.#getTablesToProcess(parsedArgs);

      if (tables.length === 0) {
        console.log('ℹ️  No tables found matching criteria');
        return;
      }

      console.log(`📋 Found ${tables.length} table(s) to process`);

      await this.#processTables(tables);
      this.#showSummary();
    } catch (error) {
      console.error('❌ Error in documentation generator:', error);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  #parseArguments(args) {
    const parsed = {
      table: null,
      group: null,
      output: null,
      verbose: false,
      help: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case CLI_CONFIG.flags.table:
          if (nextArg) {
            parsed.table = nextArg;
            i++;
          }
          break;
        case CLI_CONFIG.flags.group:
          if (nextArg) {
            parsed.group = nextArg;
            i++;
          }
          break;
        case CLI_CONFIG.flags.output:
          if (nextArg) {
            parsed.output = nextArg;
            i++;
          }
          break;
        case CLI_CONFIG.flags.verbose:
          parsed.verbose = true;
          break;
        case CLI_CONFIG.flags.help:
          parsed.help = true;
          break;
      }
    }

    if (parsed.output) {
      this.outputDir = parsed.output;
    }
    if (parsed.verbose) {
      this.verbose = parsed.verbose;
    }

    return parsed;
  }

  /**
   * Get tables to process based on arguments
   */
  async #getTablesToProcess(args) {
    try {
      const config = sequelize.config;

      // Query all tables from database
      let query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = '${config.database}'
          AND table_type = 'BASE TABLE'
      `;

      // Add filters based on arguments
      if (args.model) {
        // Convert model name back to table name if needed
        const tableName = args.model
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .slice(1);
        query += ` AND table_name LIKE '%${tableName}%'`;
      }

      if (args.prefix) {
        query += ` AND table_name LIKE '${args.prefix}%'`;
      }

      if (args.pattern) {
        query += ` AND table_name LIKE '%${args.pattern}%'`;
      }

      query += ` ORDER BY table_name`;

      const result = await sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
      });

      return result.map((row) => row.TABLE_NAME || row.table_name);
    } catch (error) {
      console.error('Error fetching tables from database:', error);
      // Fallback to example tables if database query fails
      return this.#getFallbackTables(args);
    }
  }

  /**
   * Get fallback tables if database query fails
   */
  #getFallbackTables(args) {
    const fallbackTables = ['auth_users', 'content_posts', 'config_settings', 'log_activities'];

    let filteredTables = fallbackTables;

    if (args.model) {
      const tableName = args.model
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .slice(1);
      filteredTables = fallbackTables.filter((table) => table.includes(tableName));
    }

    if (args.prefix) {
      filteredTables = filteredTables.filter((table) => table.startsWith(args.prefix));
    }

    if (args.pattern) {
      filteredTables = filteredTables.filter((table) => table.includes(args.pattern));
    }

    return filteredTables;
  }

  /**
   * Process all tables and generate documentation
   */
  async #processTables(tables) {
    this.stats.processed = tables.length;
    const fileGenerator = new DocumentationFileGenerator(this.outputDir);

    for (const tableName of tables) {
      try {
        if (this.verbose) {
          console.log(`\n🔄 Processing table: ${tableName}`);
        }

        // Introspect model
        const introspector = new ModelIntrospector(tableName);
        const modelMetadata = await introspector.getModelMetadata();

        // Generate documentation
        const docGenerator = new CrudDocumentationGenerator(modelMetadata);
        const crudDocs = docGenerator.generateCrudDocs();

        // Write documentation file
        const filePath = await fileGenerator.generateDocumentationFile(modelMetadata, crudDocs);

        this.stats.successful++;
        console.log(`✅ Generated documentation: ${filePath}`);
      } catch (error) {
        this.stats.failed++;
        console.error(`❌ Failed to process ${tableName}:`, error.message);
      }
    }
  }

  /**
   * Show help information
   */
  #showHelp() {
    console.log(CLI_CONFIG.help);
  }

  /**
   * Display generation summary
   */
  #showSummary() {
    this.stats.endTime = performance.now();
    const duration = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 DOCUMENTATION GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Tables processed: ${this.stats.processed}`);
    console.log(`✅ Successful: ${this.stats.successful}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log('='.repeat(60));

    if (this.stats.failed > 0) {
      console.log('⚠️  Some documentation files failed to generate. Check the logs above for details.');
    } else {
      console.log('🎉 All documentation files generated successfully!');
    }
  }
}

// =============================================================================
// SCRIPT EXECUTION
// =============================================================================

if (require.main === module) {
  console.log('\n' + '='.repeat(80));
  console.log('📚 CRUD DOCUMENTATION GENERATOR');
  console.log('='.repeat(80));
  console.log('📋 Automatically generates OpenAPI docs from database schema');
  console.log('🔗 Includes associations, data types, and CRUD operations');
  console.log('⚡ Optimized for your database connection configuration');
  console.log('='.repeat(80) + '\n');

  // Parse command line arguments (skip node and script name)
  const args = process.argv.slice(2);

  // Create and run the application
  const app = new CrudDocsGeneratorApp();

  // Setup graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Run the application with enhanced error handling
  app.run(args).catch((error) => {
    console.error('\n💥 Application failed to start. Please check the error details above.');
    console.error('Error:', error.message);
    process.exit(1);
  });
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  ModelIntrospector,
  CrudDocumentationGenerator,
  DocumentationFileGenerator,
  CrudDocsGeneratorApp,
  TYPE_MAPPINGS,
  EXCLUDED_FIELDS,
};
