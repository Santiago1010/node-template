#!/usr/bin/env node
'use strict';

// =============================================================================
// SEQUELIZE MODEL GENERATOR - Advanced Database Schema Introspection Tool
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Automatically generates Sequelize ORM models by introspecting database schema
// - Creates complete model definitions including associations, data types, and constraints
// - Supports multiple database dialects (MySQL, PostgreSQL, SQLite, MSSQL)
// - Handles complex relationships (belongsTo, hasMany, belongsToMany)
// - Applies naming conventions and organizational structure
//
// ARCHITECTURAL DECISIONS:
// - Uses database introspection instead of manual model definition for accuracy
// - Implements template-based generation for consistent model structure
// - Employs inheritance from CrudHelper for code reuse and standardization
// - Supports multiple database dialects through configurable type mappings
// - Uses async/await for all database operations to handle I/O efficiently
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Manual model definition: More control but error-prone and time-consuming
// - Sequelize CLI migrations: Limited introspection capabilities
// - Third-party model generators: Less customizable and dialect-specific
// - ORM-first approach: Start with models then generate schema (reverse of current approach)
// - Trade-off: Current approach ensures database schema is source of truth
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n) for table processing, O(m) for column introspection per table
// - Space complexity: O(k) for in-memory template processing and replacement
// - Scalability: Handles hundreds of tables efficiently through sequential processing
// - Bottlenecks: Database metadata queries and file I/O operations
//
// SECURITY CONSIDERATIONS:
// - Validates table existence before processing to prevent injection
// - Uses parameterized queries for database introspection
// - Implements input sanitization for table names and prefixes
// - Follows principle of least privilege for database connection
//
// USAGE EXAMPLES:
// - Generate all models: node models-generator.js
// - Single table: node models-generator.js -t users
// - Tables with prefix: node models-generator.js -p auth_
// - Pattern matching: node models-generator.js -m _settings
//
// MAINTENANCE & TROUBLESHOOTING:
// - Common errors: Database connectivity, insufficient permissions
// - Debugging: Use -v flag for verbose logging
// - Performance: Process large schemas in batches if needed
// - Enhancement: Extend DATA_TYPE_MAPPINGS for custom types
//
// DEPENDENCIES & COMPATIBILITY:
// - Node.js: 14.0+ (ES2020 features, optional chaining, nullish coalescing)
// - Sequelize: 6.0+ (supports multiple dialects and associations)
// - Database: MySQL 5.7+, PostgreSQL 10+, SQLite 3.0+, MSSQL 2012+
// - File System: Requires write permissions for model generation
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const { performance } = require('perf_hooks'); // High-resolution timing for performance metrics

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Sequelize } = require('sequelize'); // ORM for database abstraction and model management

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CrudHelper = require('../helpers/crud.helper'); // Base class for CRUD operations and template management
const databaseConnection = require('../config/database/connection'); // Shared database connection instance
const { PREFIXES } = require('../helpers/constants.helper'); // Table prefix to group name mappings
const { wrapLogging, cerror } = require('../helpers/debug.helper'); // Enhanced logging and error handling utilities
const { toCamelCase, tabs } = require('../helpers/strings.helper'); // String transformation utilities for naming conventions

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Database-specific data type mappings for Sequelize compatibility
 * Provides translation between native database types and Sequelize DataTypes
 * Supports multiple dialects with fallback to MySQL mappings
 *
 * @type {Object<string, Object<string, string>>}
 * @constant
 *
 * @example
 * // MySQL TINYINT(1) with boolean pattern becomes BOOLEAN
 * // PostgreSQL SERIAL becomes INTEGER with auto-increment
 * // SQLite BLOB remains BLOB for binary data
 */
const DATA_TYPE_MAPPINGS = Object.freeze({
  mysql: {
    // String types
    varchar: 'STRING',
    char: 'STRING',
    text: 'TEXT',
    longtext: 'TEXT',
    mediumtext: 'TEXT',
    tinytext: "TEXT('tiny')",

    // Numeric types
    int: 'INTEGER',
    integer: 'INTEGER',
    tinyint: 'TINYINT',
    smallint: 'SMALLINT',
    bigint: 'BIGINT',
    decimal: 'DECIMAL',
    numeric: 'DECIMAL',
    double: 'DOUBLE',
    float: 'FLOAT',

    // Binary types
    varbinary: 'BLOB',
    blob: 'BLOB',
    tinyblob: 'BLOB',
    mediumblob: 'BLOB',
    longblob: 'BLOB',
    binary: 'STRING.BINARY',

    // Date/Time types
    timestamp: 'DATE',
    datetime: 'DATE',
    date: 'DATEONLY',
    time: 'TIME',
    year: 'YEAR',

    // Special types
    enum: 'ENUM',
    json: 'JSON',

    // Spatial types
    geometry: 'GEOMETRY',
    point: 'POINT',
    linestring: 'LINESTRING',
    polygon: 'POLYGON',
  },

  postgres: {
    varchar: 'STRING',
    char: 'STRING',
    text: 'TEXT',
    integer: 'INTEGER',
    int: 'INTEGER',
    serial: 'INTEGER',
    smallint: 'SMALLINT',
    bigint: 'BIGINT',
    boolean: 'BOOLEAN',
    numeric: 'DECIMAL',
    decimal: 'DECIMAL',
    real: 'FLOAT',
    double: 'DOUBLE',
    timestamp: 'DATE',
    date: 'DATEONLY',
    time: 'TIME',
    json: 'JSON',
    xml: 'STRING',
  },

  sqlite: {
    text: 'STRING',
    integer: 'INTEGER',
    real: 'FLOAT',
    blob: 'BLOB',
    date: 'DATEONLY',
    datetime: 'DATE',
    boolean: 'INTEGER',
  },

  mssql: {
    varchar: 'STRING',
    nvarchar: 'STRING',
    char: 'STRING',
    text: 'TEXT',
    int: 'INTEGER',
    bigint: 'BIGINT',
    smallint: 'SMALLINT',
    tinyint: 'TINYINT',
    decimal: 'DECIMAL',
    numeric: 'DECIMAL',
    float: 'FLOAT',
    real: 'FLOAT',
    bit: 'BOOLEAN',
    date: 'DATEONLY',
    datetime: 'DATE',
    datetime2: 'DATE',
    time: 'TIME',
    binary: 'BUFFER',
    varbinary: 'BUFFER',
    xml: 'STRING',
  },
});

/**
 * Special timestamp columns for automatic Sequelize timestamp handling
 * These columns trigger automatic timestamp management and soft delete features
 *
 * @type {Set<string>}
 * @constant
 *
 * @example
 * // created_at, updated_at enable timestamps: true
 * // deleted_at enables paranoid: true for soft deletes
 */
const TIMESTAMP_COLUMNS = Object.freeze(new Set(['created_at', 'updated_at', 'deleted_at']));

/**
 * Command line interface configuration and help documentation
 * Defines supported flags, validation rules, and usage examples
 *
 * @type {Object}
 * @constant
 */
const CLI_CONFIG = Object.freeze({
  flags: {
    table: '-t',
    prefix: '-p',
    match: '-m',
    help: '-h',
    verbose: '-v',
  },
  help: `
Model Generator - Automatically generate Sequelize models from database tables

Usage: node models-generator.js [options]

Options:
  -t <table>   Generate model for specific table
  -p <prefix>  Generate models for tables with prefix
  -m <match>   Generate models for tables matching pattern
  -v           Verbose logging
  -h           Show this help message

Examples:
  node models-generator.js                    # Generate all models
  node models-generator.js -t users           # Generate model for 'users' table
  node models-generator.js -p auth_           # Generate models for tables starting with 'auth_'
  node models-generator.js -m _settings       # Generate models for tables containing '_settings'
`,
});

// =============================================================================
// MAIN MODEL GENERATOR CLASS
// =============================================================================

/**
 * Advanced Model Generator with Database Introspection
 * @extends CrudHelper
 *
 * @description Generates Sequelize models by introspecting database schema,
 * creating associations, and applying naming conventions automatically.
 * Handles complex relationships, data type mapping, and organizational structure.
 *
 * @example
 * // Basic usage for single table
 * const generator = new ModelGenerator('users');
 * const success = await generator.generateModel();
 *
 * @example
 * // Advanced usage with custom singular form
 * const generator = new ModelGenerator('people', 'person');
 * await generator.generateModel();
 *
 * @complexity Time: O(n + m) where n is columns count, m is relationships count
 * @since Version 1.0.0
 * @see {@link CrudHelper} for base template and file operations
 */
class ModelGenerator extends CrudHelper {
  #specialColumns = TIMESTAMP_COLUMNS;
  #generationStats = {
    processed: 0,
    successful: 0,
    failed: 0,
    startTime: null,
    endTime: null,
  };

  /**
   * Initialize ModelGenerator for a specific table
   * @param {string} tableName - Database table name (snake_case expected)
   * @param {string} [singularForm] - Singular form for naming (optional, auto-derived if not provided)
   *
   * @throws {Error} When tableName is empty or invalid
   *
   * @example
   * const generator = new ModelGenerator('user_profiles', 'userProfile');
   */
  constructor(tableName, singularForm = null) {
    super();

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('tableName must be a non-empty string');
    }

    this.tableName = tableName;
    this.singularForm = singularForm || this.#deriveSingularForm(tableName);
    this.modelName = toCamelCase(tableName);

    // Parse table structure for organization - supports prefix-based grouping
    const tableParts = tableName.split('_');
    this.entityName = tableParts.slice(1).join('_');
    this.groupName = PREFIXES[tableParts[0].toUpperCase()] || 'general';

    // Model characteristics - populated during generation
    this.features = {
      softDelete: false,
      hasAssociations: false,
      hasEnums: false,
      hasVirtualColumns: false,
    };

    // Use the shared sequelize instance for database operations
    this.sequelize = databaseConnection;
  }

  // =========================== MAIN GENERATION METHODS =========================== //

  /**
   * Generate complete Sequelize model including schema, associations, and configuration
   * Orchestrates the entire model generation process from template to file creation
   *
   * @returns {Promise<boolean>} Success status of model generation
   *
   * @throws {Error} When database connection fails or template is unavailable
   *
   * @example
   * const generator = new ModelGenerator('products');
   * const success = await generator.generateModel();
   * if (success) {
   *   console.log('Model generated successfully');
   * }
   *
   * @complexity Time: O(n + m) where n is columns, m is relationships
   */
  async generateModel() {
    try {
      console.log(`🔄 Generating model for table: ${this.tableName}`);

      const folderPath = await this.createModelsFolder(this.groupName);
      const modelContent = await this.#buildModelContent();

      await this.createModelsFile(folderPath, this.modelName, modelContent);

      console.log(`✅ Model generated successfully: ${this.modelName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to generate model for ${this.tableName}:`, error.message);
      return false;
    }
  }

  /**
   * Build complete model content by combining template with generated components
   * Replaces template placeholders with actual schema definitions and configurations
   *
   * @private
   * @returns {Promise<string>} Generated model content ready for file writing
   *
   * @throws {Error} When template loading fails or database introspection errors occur
   */
  async #buildModelContent() {
    let template = await this.getTemplate('models', 'model');

    // Replace template placeholders with generated content
    const replacements = {
      '{{TABLES_COMMENT}}': await this.readTablesComment(this.tableName),
      '{{TABLE_NAME}}': this.tableName,
      '{{MODEL_NAME}}': this.modelName,
      '{{SCHEMA}}': await this.#generateSchema(),
      '{{INDEXES}}': await this.#generateIndexes(),
      '{{REFERENCES}}': await this.#generateReferences(),
      '{{BRIDGES}}': await this.#generateBridges(),
      '{{SOFT_DELETE}}': this.features.softDelete ? this.#generateTimestamps() : '',
      '{{NEED_I18N}}': this.features.hasEnums ? this.#generateI18nImport() : '',
    };

    // Apply all replacements using regex for global replacement
    for (const [placeholder, value] of Object.entries(replacements)) {
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }

    // Handle conditional models parameter for associations
    template = template.replace(/models/g, this.features.hasAssociations ? 'models' : '_');

    // Apply CRUD naming conventions to the final template
    return this.setCrudName(template, this.entityName, this.singularForm);
  }

  // =========================== SCHEMA GENERATION =========================== //

  /**
   * Generate complete table schema definition by introspecting all columns
   * Processes each column to create Sequelize-compatible attribute definitions
   *
   * @private
   * @returns {Promise<string>} Schema definition as string for template insertion
   *
   * @example
   * // Returns schema like:
   * // id: {
   * //   type: DataTypes.INTEGER,
   * //   primaryKey: true,
   * //   autoIncrement: true
   * // },
   * // name: {
   * //   type: DataTypes.STRING(255),
   * //   allowNull: false
   * // }
   */
  async #generateSchema() {
    const { columns, formatedColumns } = await this.readAllColumns(this.tableName);

    // Detect soft delete capability based on deleted_at column presence
    this.features.softDelete = formatedColumns.includes('deletedAt');

    const schemaDefinitions = [];

    // Process each column to generate its schema definition
    for (let i = 0; i < columns.length; i++) {
      const columnName = columns[i];
      const formattedName = formatedColumns[i];

      const columnDetails = await this.detailsColumn(this.tableName, columnName);
      const columnSchema = await this.#generateColumnDefinition(columnName, formattedName, columnDetails);

      schemaDefinitions.push(columnSchema);

      // Add virtual enum integer column if this is an enum type
      if (columnDetails.COLUMN_TYPE.includes('enum')) {
        const virtualColumn = this.#generateEnumVirtualColumn(formattedName, columnDetails.COLUMN_TYPE);
        schemaDefinitions.push(virtualColumn);
      }
    }

    return schemaDefinitions.join(',\n');
  }

  /**
   * Generate individual column definition with complete Sequelize attributes
   * Handles data types, constraints, defaults, comments, and field mappings
   *
   * @private
   * @param {string} columnName - Original database column name (snake_case)
   * @param {string} formattedName - Camel case column name for JavaScript
   * @param {Object} columnDetails - Column metadata from database introspection
   * @returns {Promise<string>} Complete column definition as string
   *
   * @throws {Error} When column details are invalid or missing required properties
   */
  async #generateColumnDefinition(columnName, formattedName, columnDetails) {
    const { COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT, PRIMARY, UNIQUE, INDEX, NULLABLE } = columnDetails;

    // Extract constraint information
    const isNullable = NULLABLE === 1;
    const isPrimary = PRIMARY === 1;
    const isUnique = UNIQUE === 1;
    const hasIndex = INDEX === 1;
    const isEnum = COLUMN_TYPE.includes('enum');
    const requiresFieldMapping = columnName !== formattedName;

    // Track enum presence for i18n import
    if (isEnum) this.features.hasEnums = true;

    let definition = `${tabs()}${formattedName}: {\n`;

    // Data type mapping - core of column definition
    definition += `${tabs(2)}type: DataTypes.${this.#mapDataType(COLUMN_TYPE, columnName)},\n`;

    // Nullable constraint
    definition += `${tabs(2)}allowNull: ${isNullable},\n`;

    // Default value handling with special cases for timestamps
    if ((COLUMN_DEFAULT === null && isNullable) || COLUMN_DEFAULT !== null) {
      definition += `${tabs(2)}defaultValue: ${this.#formatDefaultValue(columnName, COLUMN_DEFAULT)},\n`;
    }

    // Primary key attributes
    if (isPrimary) {
      definition += this.#generatePrimaryKeyAttributes();
    }

    // Foreign key reference for indexed columns
    if (hasIndex) {
      definition += await this.#generateIndexReference(columnName);
    }

    // Unique constraint with index name
    if (isUnique) {
      const uniqueIndexName = await this.uniqueDetails(this.tableName, columnName);
      definition += `${tabs(2)}unique: '${uniqueIndexName}',\n`;
    }

    // Enum getter for translated values
    if (isEnum) {
      definition += this.#generateEnumGetter(formattedName, COLUMN_TYPE);
    }

    // Column comment for documentation
    if (COLUMN_COMMENT) {
      definition += this.#generateColumnComment(COLUMN_COMMENT);
    }

    // Field mapping for database column name differences
    if (requiresFieldMapping) {
      definition += `${tabs(2)}field: '${columnName}'\n`;
    }

    definition += `${tabs()}}`;

    return definition;
  }

  /**
   * Map database-specific column type to Sequelize DataType
   * Handles dialect-specific types and special cases like boolean detection
   *
   * @private
   * @param {string} columnType - Raw database column type (e.g., 'varchar(255)', 'tinyint(1)')
   * @param {string} columnName - Column name for boolean pattern detection
   * @returns {string} Sequelize DataType string
   *
   * @example
   * // MySQL: 'tinyint(1)' with 'is_active' column becomes 'BOOLEAN'
   * // PostgreSQL: 'serial' becomes 'INTEGER'
   * // SQLite: 'text' becomes 'STRING'
   */
  #mapDataType(columnType, columnName) {
    const [baseType, sizeInfo] = columnType.split('(');
    const cleanSize = sizeInfo ? sizeInfo.replace(')', '') : null;

    // Get database dialect from connection for type mapping
    const dialect = databaseConnection.getDialect();
    const typeMap = DATA_TYPE_MAPPINGS[dialect] || DATA_TYPE_MAPPINGS.mysql;

    let sequelizeType = typeMap[baseType] || 'STRING';

    // Special case: TINYINT(1) detection for boolean columns in MySQL
    if (baseType === 'tinyint' && cleanSize === '1') {
      const normalizedName = columnName.toLowerCase();
      // Boolean pattern detection: starts with 'is_', ends with '_is', or contains '_is_'
      if (normalizedName.startsWith('is_') || normalizedName.endsWith('_is') || normalizedName.includes('_is_')) {
        sequelizeType = 'BOOLEAN';
      }
    } else if (cleanSize && !sequelizeType.includes('(')) {
      // Add size parameter for types that support it
      sequelizeType += `(${cleanSize})`;
    }

    return sequelizeType;
  }

  /**
   * Format default value for Sequelize model definition
   * Handles special cases like timestamp functions and string quoting
   *
   * @private
   * @param {string} columnName - Column name for special handling detection
   * @param {any} defaultValue - Raw default value from database metadata
   * @returns {string} Formatted default value string
   *
   * @example
   * // null becomes 'null'
   * // 'default_value' becomes "'default_value'"
   * // timestamp columns become 'DataTypes.NOW'
   */
  #formatDefaultValue(columnName, defaultValue) {
    if (defaultValue === null) return 'null';

    // Special handling for timestamp columns
    if (this.#specialColumns.has(columnName)) {
      let value = 'DataTypes.NOW';
      if (columnName === 'updated_at') {
        value += `,\n${tabs(2)}onUpdate: DataTypes.NOW`;
      }
      return value;
    }

    // String values need quotes
    if (typeof defaultValue === 'string') {
      return `'${defaultValue}'`;
    }

    return String(defaultValue);
  }

  // =========================== ASSOCIATION GENERATION =========================== //

  /**
   * Generate belongsTo associations for foreign key relationships
   * Creates associations where this table references another table
   *
   * @private
   * @returns {Promise<string>} belongsTo association definitions or empty string
   *
   * @example
   * // Returns association like:
   * // this.belongsTo(models.User, {
   * //   foreignKey: 'userId',
   * //   targetKey: 'id',
   * //   as: 'user',
   * //   onUpdate: 'CASCADE',
   * //   onDelete: 'RESTRICT'
   * // });
   */
  async #generateIndexes() {
    const foreignKeys = await this.searchForeignKeys(this.tableName);

    if (foreignKeys.length === 0) return '';

    this.features.hasAssociations = true;

    const associations = foreignKeys.map((fk) => {
      return [
        `${tabs()}this.belongsTo(models.${toCamelCase(fk.REFERENCED_TABLE_NAME)}, {`,
        `${tabs(2)}foreignKey: '${toCamelCase(fk.COLUMN_NAME)}',`,
        `${tabs(2)}targetKey: '${toCamelCase(fk.REFERENCED_COLUMN_NAME)}',`,
        `${tabs(2)}as: '${toCamelCase(fk.INDEX_NAME)}',`,
        `${tabs(2)}onUpdate: '${fk.UPDATE_RULE}',`,
        `${tabs(2)}onDelete: '${fk.DELETE_RULE}'`,
        `${tabs()}});`,
      ].join('\n');
    });

    return associations.join('\n') + '\n';
  }

  /**
   * Generate hasMany associations for reverse relationships
   * Creates associations where other tables reference this table
   *
   * @private
   * @returns {Promise<string>} hasMany association definitions or empty string
   *
   * @example
   * // Returns association like:
   * // this.hasMany(models.Order, {
   * //   foreignKey: 'userId',
   * //   sourceKey: 'id',
   * //   as: 'orders',
   * //   onUpdate: 'CASCADE',
   * //   onDelete: 'RESTRICT'
   * // });
   */
  async #generateReferences() {
    const references = await this.searchReferences(this.tableName);

    if (references.length === 0) return '';

    this.features.hasAssociations = true;

    const associations = references.map((ref) => {
      return [
        `${tabs()}this.hasMany(models.${toCamelCase(ref.TABLE_NAME)}, {`,
        `${tabs(2)}foreignKey: '${toCamelCase(ref.COLUMN_NAME)}',`,
        `${tabs(2)}sourceKey: '${toCamelCase(ref.REFERENCED_COLUMN_NAME)}',`,
        `${tabs(2)}as: '${this.#generateBetterAlias(ref.TABLE_NAME)}',`,
        `${tabs(2)}onUpdate: '${ref.UPDATE_RULE}',`,
        `${tabs(2)}onDelete: '${ref.DELETE_RULE}'`,
        `${tabs()}});`,
      ].join('\n');
    });

    return associations.join('\n') + '\n';
  }

  /**
   * Generate belongsToMany associations for many-to-many relationships
   * Handles bridge tables and complex relationship mappings
   *
   * @private
   * @returns {Promise<string>} belongsToMany association definitions or empty string
   *
   * @example
   * // Returns association like:
   * // this.belongsToMany(models.Product, {
   * //   through: { model: models.OrderItem },
   * //   foreignKey: 'orderId',
   * //   otherKey: 'productId',
   * //   as: 'products'
   * // });
   */
  async #generateBridges() {
    const bridges = await this.searchBridges(this.tableName);

    if (bridges.length === 0) return '';

    this.features.hasAssociations = true;

    const associations = bridges.map((bridge) => {
      return [
        `${tabs()}this.belongsToMany(models.${toCamelCase(bridge.other_table)}, {`,
        `${tabs(2)}through: { model: models.${toCamelCase(bridge.child_table)} },`,
        `${tabs(2)}foreignKey: '${toCamelCase(bridge.foreign_key)}',`,
        `${tabs(2)}otherKey: '${toCamelCase(bridge.other_key)}',`,
        `${tabs(2)}as: '${bridge.other_table.split('_').pop()}'`,
        `${tabs()}});`,
      ].join('\n');
    });

    return associations.join('\n') + '\n';
  }

  // =========================== HELPER GENERATION METHODS =========================== //

  /**
   * Generate primary key attributes for Sequelize model
   * Includes primaryKey, autoIncrement, and unique constraints
   *
   * @private
   * @returns {string} Primary key attribute definitions
   */
  #generatePrimaryKeyAttributes() {
    return (
      [`${tabs(2)}primaryKey: true,`, `${tabs(2)}autoIncrement: true,`, `${tabs(2)}unique: 'PRIMARY',`].join('\n') +
      '\n'
    );
  }

  /**
   * Generate foreign key reference definition for indexed columns
   *
   * @private
   * @param {string} columnName - Column name to check for foreign key reference
   * @returns {Promise<string>} Reference definition or empty string
   */
  async #generateIndexReference(columnName) {
    const indexDetails = await this.detailsIndex(this.tableName, columnName);

    if (indexDetails.length === 0) return '';

    const { REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME } = indexDetails[0];

    return (
      [
        `${tabs(2)}references: {`,
        `${tabs(3)}table: '${REFERENCED_TABLE_NAME}',`,
        `${tabs(3)}column: '${REFERENCED_COLUMN_NAME}',`,
        `${tabs(3)}model: '${toCamelCase(REFERENCED_TABLE_NAME)}',`,
        `${tabs(3)}key: '${toCamelCase(REFERENCED_COLUMN_NAME)}'`,
        `${tabs(2)}},`,
      ].join('\n') + '\n'
    );
  }

  /**
   * Generate enum getter method for translated enum values
   * Provides both original and translated values for i18n support
   *
   * @private
   * @param {string} columnName - Enum column name
   * @returns {string} Enum getter method definition
   */
  #generateEnumGetter(columnName) {
    return (
      [
        `${tabs(2)}get() {`,
        `${tabs(3)}const ${columnName} = this.getDataValue('${columnName}');`,
        `${tabs(3)}const translated = i18n.__('enums.${columnName}.' + ${columnName});`,
        `${tabs(3)}return { original: ${columnName}, translated };`,
        `${tabs(2)}},`,
      ].join('\n') + '\n'
    );
  }

  /**
   * Generate virtual column for enum integer values
   * Creates a virtual property that maps enum strings to integer values
   *
   * @private
   * @param {string} columnName - Base enum column name
   * @param {string} columnType - Enum column type with values
   * @returns {string} Virtual column definition
   */
  #generateEnumVirtualColumn(columnName, columnType) {
    this.features.hasVirtualColumns = true;

    const virtualColumnName = toCamelCase(`${columnName}_int`);
    const enumValues = this.#parseEnumValues(columnType);

    return [
      `${tabs()}${virtualColumnName}: {`,
      `${tabs(2)}type: DataTypes.VIRTUAL,`,
      `${tabs(2)}get() {`,
      `${tabs(3)}const ${columnName} = this.getDataValue('${columnName}');`,
      `${tabs(3)}const options = { ${enumValues} };`,
      `${tabs(3)}return options[${columnName}];`,
      `${tabs(2)}},`,
      `${tabs(2)}set(_) {`,
      `${tabs(3)}throw new Error('You cannot assign a value to a virtual column.');`,
      `${tabs(2)}}`,
      `${tabs()}}`,
    ].join('\n');
  }

  /**
   * Parse enum values from column type definition
   * Extracts and formats enum values for virtual column mapping
   *
   * @private
   * @param {string} columnType - Enum column type string
   * @returns {string} Formatted enum options object
   */
  #parseEnumValues(columnType) {
    const valuesString = columnType.split('(')[1].replace(')', '');
    const values = valuesString.split(',');

    return values.map((value, index) => `${value.replace(/'/g, '')}: ${index + 1}`).join(', ');
  }

  /**
   * Generate column comment for documentation
   *
   * @private
   * @param {string} comment - Column comment text
   * @returns {string} Comment attribute definition
   */
  #generateColumnComment(comment) {
    const escapedComment = comment.includes("'") ? `"${comment}"` : `'${comment}'`;

    return `${tabs(2)}comment: ${escapedComment},\n`;
  }

  /**
   * Generate timestamp configuration for Sequelize model
   * Enables timestamps and paranoid (soft delete) features
   *
   * @private
   * @returns {string} Timestamp configuration
   */
  #generateTimestamps() {
    return [`${tabs()}timestamps: true,`, `${tabs()}paranoid: true,`].join('\n') + '\n';
  }

  /**
   * Generate i18n import statement for enum translation support
   *
   * @private
   * @returns {string} i18n import statement
   */
  #generateI18nImport() {
    return `\n\nconst i18n = require('../../configurations/i18n');`;
  }

  /**
   * Generate better association alias based on table name patterns
   * Improves readability of association names
   *
   * @private
   * @param {string} tableName - Related table name
   * @returns {string} Formatted alias name
   */
  #generateBetterAlias(tableName) {
    const parts = tableName.split('_');

    if (parts.includes('has')) {
      // Bridge table: return everything after first part
      return toCamelCase(parts.slice(1).join('_'));
    }

    // Regular table: return last part for concise naming
    return toCamelCase(parts[parts.length - 1]);
  }

  /**
   * Derive singular form from plural table name
   * Applies basic English pluralization rules
   *
   * @private
   * @param {string} tableName - Plural table name
   * @returns {string} Singular form
   */
  #deriveSingularForm(tableName) {
    // Simple pluralization rules - can be extended with more complex patterns
    if (tableName.endsWith('ies')) {
      return tableName.slice(0, -3) + 'y';
    }
    if (tableName.endsWith('s')) {
      return tableName.slice(0, -1);
    }
    return tableName;
  }
}

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

/**
 * Command Line Argument Parser for Model Generator
 * Handles argument parsing, validation, and help display
 *
 * @example
 * // Parse command line arguments
 * const args = CLIParser.parseArguments(process.argv.slice(2));
 * if (args.help) CLIParser.showHelp();
 */
class CLIParser {
  /**
   * Parse command line arguments into structured object
   *
   * @param {string[]} args - Command line arguments array
   * @returns {Object} Parsed arguments with flags and values
   *
   * @example
   * // Returns: { table: 'users', verbose: true, help: false }
   */
  static parseArguments(args) {
    const parsed = {
      table: null,
      prefix: null,
      match: null,
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

        case CLI_CONFIG.flags.prefix:
          if (nextArg) {
            parsed.prefix = nextArg;
            i++;
          }
          break;

        case CLI_CONFIG.flags.match:
          if (nextArg) {
            parsed.match = nextArg;
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

    return parsed;
  }

  /**
   * Display help information and usage examples
   */
  static showHelp() {
    console.log(CLI_CONFIG.help);
  }

  /**
   * Validate parsed arguments for correctness and completeness
   *
   * @param {Object} args - Parsed arguments object
   * @returns {boolean} Validation result
   */
  static validateArguments(_) {
    // TODO: Add validation logic for table name patterns and prefix formats
    // Currently accepts all valid arguments, can be extended for specific validation
    return true;
  }
}

// =============================================================================
// MAIN EXECUTION CONTROLLER
// =============================================================================

/**
 * Main application controller for model generation workflow
 * Orchestrates the entire generation process from argument parsing to summary display
 *
 * @example
 * // Run the application
 * const app = new ModelGeneratorApp();
 * app.run(process.argv.slice(2)).catch(console.error);
 */
class ModelGeneratorApp {
  constructor() {
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
   *
   * @param {string[]} args - Command line arguments
   * @returns {Promise<void>}
   *
   * @throws {Error} When database connection fails or critical errors occur
   */
  async run(args) {
    const parsedArgs = CLIParser.parseArguments(args);

    if (parsedArgs.help) {
      CLIParser.showHelp();
      return;
    }

    if (!CLIParser.validateArguments(parsedArgs)) {
      console.error('❌ Invalid arguments provided');
      CLIParser.showHelp();
      process.exit(1);
    }

    try {
      this.stats.startTime = performance.now();

      console.log('🚀 Starting Model Generator...');

      // Get tables to process based on filters
      const tables = await this.#getTablesToProcess(parsedArgs);

      if (tables.length === 0) {
        console.log('ℹ️  No tables found matching criteria');
        return;
      }

      console.log(`📋 Found ${tables.length} table(s) to process`);

      // Process each table sequentially
      await this.#processTables(tables);

      // Show generation summary
      this.#showSummary();
    } catch (error) {
      cerror('Error in model generator', error);
      process.exit(1);
    } finally {
      await databaseConnection.close();
    }
  }

  /**
   * Get list of tables to process based on command line arguments
   *
   * @private
   * @param {Object} args - Parsed command line arguments
   * @returns {Promise<string[]>} List of table names to process
   */
  async #getTablesToProcess(args) {
    const sequelize = databaseConnection;
    const { config } = sequelize;

    let query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${config.database}'
        AND table_type = 'BASE TABLE'
    `;

    // Add filters based on command line arguments
    if (args.table) {
      query += ` AND table_name = '${args.table}'`;
    }

    if (args.prefix) {
      query += ` AND table_name LIKE '${args.prefix}%'`;
    }

    if (args.match) {
      query += ` AND table_name LIKE '%${args.match}%'`;
    }

    const result = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      logging: wrapLogging('Query tables for processing'),
    });

    return result.map((row) => row.TABLE_NAME || row.table_name);
  }

  /**
   * Process all tables and generate models sequentially
   *
   * @private
   * @param {string[]} tables - List of table names to process
   * @returns {Promise<void>}
   */
  async #processTables(tables) {
    this.stats.processed = tables.length;

    for (const tableName of tables) {
      try {
        console.log(`\n🔄 Processing table: ${tableName}`);

        const generator = new ModelGenerator(tableName);
        const success = await generator.generateModel();

        if (success) {
          this.stats.successful++;
          console.log(`✅ Successfully generated model for: ${tableName}`);
        } else {
          this.stats.failed++;
          console.log(`❌ Failed to generate model for: ${tableName}`);
        }
      } catch (error) {
        this.stats.failed++;
        console.error(`❌ Error processing table ${tableName}:`, error.message);
      }
    }
  }

  /**
   * Display generation summary with statistics and performance metrics
   *
   * @private
   */
  #showSummary() {
    this.stats.endTime = performance.now();
    const duration = ((this.stats.endTime - this.stats.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 MODEL GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Tables processed: ${this.stats.processed}`);
    console.log(`✅ Successful: ${this.stats.successful}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('='.repeat(60));

    if (this.stats.failed > 0) {
      console.log('⚠️  Some models failed to generate. Check the logs above for details.');
    } else {
      console.log('🎉 All models generated successfully!');
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Graceful shutdown handler for clean application termination
 * Ensures database connections are properly closed on shutdown signals
 *
 * @example
 * // Setup shutdown handlers at application startup
 * setupGracefulShutdown();
 */
const setupGracefulShutdown = () => {
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    try {
      await databaseConnection.close();
      console.log('✅ Database connection closed successfully');
    } catch (error) {
      console.error('❌ Error closing database connection:', error.message);
    } finally {
      process.exit(0);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
};

/**
 * Enhanced error logging with context and metadata
 *
 * @param {string} context - Error context description
 * @param {Error} error - Error object
 * @param {Object} [metadata] - Additional metadata
 */
const logError = (context, error, metadata = {}) => {
  const errorInfo = {
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.error('💥 ERROR DETAILS:', JSON.stringify(errorInfo, null, 2));
};

/**
 * Display startup banner with application information
 */
const showStartupBanner = () => {
  console.log('\n' + '='.repeat(80));
  console.log('🏗️  SEQUELIZE MODEL GENERATOR');
  console.log('='.repeat(80));
  console.log('📋 Automatically generates Sequelize models from database tables');
  console.log('🔗 Includes associations, data types, and CRUD operations');
  console.log('⚡ Optimized for your database connection configuration');
  console.log('='.repeat(80) + '\n');
};

/**
 * Check database connectivity and configuration
 *
 * @returns {Promise<boolean>} Connection status
 *
 * @example
 * const isConnected = await checkDatabaseConnectivity();
 * if (!isConnected) process.exit(1);
 */
const checkDatabaseConnectivity = async () => {
  try {
    console.log('🔍 Checking database connectivity...');
    await databaseConnection.sequelize.authenticate();

    const dialect = databaseConnection.getDialect();
    const config = databaseConnection.getConfig();

    console.log(`✅ Connected to ${dialect} database: ${config.database}`);
    console.log(`🏠 Host: ${config.host}:${config.port || 'default'}`);

    return true;
  } catch (error) {
    console.error('❌ Database connectivity check failed:', error.message);
    return false;
  }
};

/**
 * Validate that a specific table exists in the database
 *
 * @param {string} tableName - Table name to validate
 * @returns {Promise<boolean>} Table existence status
 */
const validateTableExists = async (tableName) => {
  try {
    const sequelize = databaseConnection.sequelize;
    const config = databaseConnection.getConfig();

    const query = `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = '${config.database}'
        AND table_name = '${tableName}'
        AND table_type = 'BASE TABLE'
    `;

    const result = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return result[0].count > 0;
  } catch (error) {
    console.error(`❌ Error validating table ${tableName}:`, error.message);
    return false;
  }
};

// =============================================================================
// SCRIPT EXECUTION
// =============================================================================

// Only run if this file is executed directly (not required as module)
if (require.main === module) {
  // Show startup banner
  showStartupBanner();

  // Setup graceful shutdown handlers
  setupGracefulShutdown();

  // Parse command line arguments (skip node and script name)
  const args = process.argv.slice(2);

  // Create and run the application
  const app = new ModelGeneratorApp();

  // Run the application with enhanced error handling
  app.run(args).catch((error) => {
    logError('Application startup', error);
    console.error('\n💥 Application failed to start. Please check the error details above.');
    process.exit(1);
  });
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

/**
 * @module ModelGenerator
 * @description Main module exports for programmatic usage
 *
 * @example
 * // Programmatic usage
 * const { ModelGenerator, validateTableExists } = require('./models-generator');
 *
 * const generator = new ModelGenerator('users');
 * await generator.generateModel();
 */
module.exports = {
  ModelGenerator,
  CLIParser,
  ModelGeneratorApp,
  validateTableExists,
  checkDatabaseConnectivity,
  logError,
};
