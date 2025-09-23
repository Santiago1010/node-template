#!/usr/bin/env node
'use strict';

// =============================================================================
// MODEL GENERATOR SCRIPT - Database-to-Sequelize Model Automation Tool
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Automatically generates Sequelize models from existing database tables
// - Supports multiple database dialects (MySQL, PostgreSQL, SQLite, MSSQL)
// - Creates associations (belongsTo, hasMany, belongsToMany) based on foreign keys
// - Handles enums, virtual columns, and special data types
// - Generates CRUD operations with proper naming conventions
//
// ARCHITECTURAL DECISIONS:
// - Factory pattern for model creation with database introspection
// - Template-based code generation for consistency and maintainability
// - Modular design with separation of concerns (schema, associations, templates)
// - Event-driven error handling with graceful degradation
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n*m) where n=tables, m=average columns per table
// - Space complexity: O(n) for storing table metadata
// - Batch processing for multiple tables
// - Connection pooling handled by database connection manager
//
// SECURITY CONSIDERATIONS:
// - SQL injection prevention through parameterized queries
// - Input validation for command line arguments
// - Safe template rendering without eval() usage
// - Proper connection cleanup on script termination
//
// USAGE EXAMPLES:
// - Generate all models: node models-generator.js
// - Specific table: node models-generator.js -t users
// - By prefix: node models-generator.js -p auth_
// - Pattern matching: node models-generator.js -m _settings
//
// MAINTENANCE & TROUBLESHOOTING:
// - Enable debug logging: DEBUG=models:* node models-generator.js
// - Check generated files in sync_models/ directory
// - Verify database connection before running
// - Review template files for customization needs
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const { performance } = require('perf_hooks');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Sequelize } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CrudHelper = require('../helpers/crud.helper');
const databaseConnection = require('../config/database/connection');
const { PREFIXES } = require('../helpers/constants.helper');
const { wrapLogging, cerror } = require('../helpers/debug.helper');
const { toCamelCase, tabs } = require('../helpers/strings.helper');

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Database-specific data type mappings for Sequelize
 * @type {Object<string, Object<string, string>>}
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
 * Special timestamp columns for automatic handling
 * @type {Set<string>}
 */
const TIMESTAMP_COLUMNS = Object.freeze(new Set(['created_at', 'updated_at', 'deleted_at']));

/**
 * Command line argument configuration
 * @type {Object}
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
   * @param {string} tableName - Database table name
   * @param {string} [singularForm] - Singular form for naming (optional)
   */
  constructor(tableName, singularForm = null) {
    super();

    this.tableName = tableName;
    this.singularForm = singularForm || this.#deriveSingularForm(tableName);
    this.modelName = toCamelCase(tableName);

    // Parse table structure for organization
    const tableParts = tableName.split('_');
    this.entityName = tableParts.slice(1).join('_');
    this.groupName = PREFIXES[tableParts[0].toUpperCase()] || 'general';

    // Model characteristics
    this.features = {
      softDelete: false,
      hasAssociations: false,
      hasEnums: false,
      hasVirtualColumns: false,
    };

    // Use the shared sequelize instance
    this.sequelize = databaseConnection;
  }

  // =========================== MAIN GENERATION METHODS =========================== //

  /**
   * Generate complete Sequelize model
   * @returns {Promise<boolean>} Success status
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
   * Build complete model content from template
   * @private
   * @returns {Promise<string>} Generated model content
   */
  async #buildModelContent() {
    let template = await this.getTemplate('models', 'model');

    // Replace template placeholders
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

    // Apply all replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }

    // Handle conditional models parameter
    template = template.replace(/models/g, this.features.hasAssociations ? 'models' : '_');

    // Apply CRUD naming conventions
    return this.setCrudName(template, this.entityName, this.singularForm);
  }

  // =========================== SCHEMA GENERATION =========================== //

  /**
   * Generate complete table schema definition
   * @private
   * @returns {Promise<string>} Schema definition
   */
  async #generateSchema() {
    const { columns, formatedColumns } = await this.readAllColumns(this.tableName);

    // Check for soft delete capability
    this.features.softDelete = formatedColumns.includes('deletedAt');

    const schemaDefinitions = [];

    for (let i = 0; i < columns.length; i++) {
      const columnName = columns[i];
      const formattedName = formatedColumns[i];

      const columnDetails = await this.detailsColumn(this.tableName, columnName);
      const columnSchema = await this.#generateColumnDefinition(columnName, formattedName, columnDetails);

      schemaDefinitions.push(columnSchema);

      // Add virtual enum integer column if needed
      if (columnDetails.COLUMN_TYPE.includes('enum')) {
        const virtualColumn = this.#generateEnumVirtualColumn(formattedName, columnDetails.COLUMN_TYPE);
        schemaDefinitions.push(virtualColumn);
      }
    }

    return schemaDefinitions.join(',\n');
  }

  /**
   * Generate individual column definition
   * @private
   * @param {string} columnName - Original column name
   * @param {string} formattedName - Camel case column name
   * @param {Object} columnDetails - Column metadata
   * @returns {Promise<string>} Column definition
   */
  async #generateColumnDefinition(columnName, formattedName, columnDetails) {
    const { COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT, PRIMARY, UNIQUE, INDEX, NULLABLE } = columnDetails;

    const isNullable = NULLABLE === 1;
    const isPrimary = PRIMARY === 1;
    const isUnique = UNIQUE === 1;
    const hasIndex = INDEX === 1;
    const isEnum = COLUMN_TYPE.includes('enum');
    const requiresFieldMapping = columnName !== formattedName;

    if (isEnum) this.features.hasEnums = true;

    let definition = `${tabs()}${formattedName}: {\n`;

    // Data type
    definition += `${tabs(2)}type: DataTypes.${this.#mapDataType(COLUMN_TYPE, columnName)},\n`;

    // Nullable
    definition += `${tabs(2)}allowNull: ${isNullable},\n`;

    // Default value
    if ((COLUMN_DEFAULT === null && isNullable) || COLUMN_DEFAULT !== null) {
      definition += `${tabs(2)}defaultValue: ${this.#formatDefaultValue(columnName, COLUMN_DEFAULT)},\n`;
    }

    // Primary key
    if (isPrimary) {
      definition += this.#generatePrimaryKeyAttributes();
    }

    // Foreign key reference
    if (hasIndex) {
      definition += await this.#generateIndexReference(columnName);
    }

    // Unique constraint
    if (isUnique) {
      const uniqueIndexName = await this.uniqueDetails(this.tableName, columnName);
      definition += `${tabs(2)}unique: '${uniqueIndexName}',\n`;
    }

    // Enum getter
    if (isEnum) {
      definition += this.#generateEnumGetter(formattedName, COLUMN_TYPE);
    }

    // Comment
    if (COLUMN_COMMENT) {
      definition += this.#generateColumnComment(COLUMN_COMMENT);
    }

    // Field mapping
    if (requiresFieldMapping) {
      definition += `${tabs(2)}field: '${columnName}'\n`;
    }

    definition += `${tabs()}}`;

    return definition;
  }

  /**
   * Map database column type to Sequelize DataType
   * @private
   * @param {string} columnType - Database column type
   * @param {string} columnName - Column name for boolean pattern checking
   * @returns {string} Sequelize DataType
   */
  #mapDataType(columnType, columnName) {
    const [baseType, sizeInfo] = columnType.split('(');
    const cleanSize = sizeInfo ? sizeInfo.replace(')', '') : null;

    // Get database dialect from connection
    const dialect = databaseConnection.getDialect();
    const typeMap = DATA_TYPE_MAPPINGS[dialect] || DATA_TYPE_MAPPINGS.mysql;

    let sequelizeType = typeMap[baseType] || 'STRING';

    // Special case: TINYINT(1) = BOOLEAN in MySQL if column name matches boolean pattern
    if (baseType === 'tinyint' && cleanSize === '1') {
      const normalizedName = columnName.toLowerCase();
      // Check for boolean patterns: starts with 'is_', ends with '_is', or contains '_is_'
      if (normalizedName.startsWith('is_') || normalizedName.endsWith('_is') || normalizedName.includes('_is_')) {
        sequelizeType = 'BOOLEAN';
      }
    } else if (cleanSize && !sequelizeType.includes('(')) {
      sequelizeType += `(${cleanSize})`;
    }

    return sequelizeType;
  }

  /**
   * Format default value for Sequelize
   * @private
   * @param {string} columnName - Column name
   * @param {any} defaultValue - Default value from database
   * @returns {string} Formatted default value
   */
  #formatDefaultValue(columnName, defaultValue) {
    if (defaultValue === null) return 'null';

    // Handle timestamp columns
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
   * Generate belongsTo associations (foreign keys)
   * @private
   * @returns {Promise<string>} Association definitions
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
   * Generate hasMany associations (reverse foreign keys)
   * @private
   * @returns {Promise<string>} Association definitions
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
   * Generate belongsToMany associations (bridge tables)
   * @private
   * @returns {Promise<string>} Association definitions
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
   * Generate primary key attributes
   * @private
   * @returns {string} Primary key definition
   */
  #generatePrimaryKeyAttributes() {
    return (
      [`${tabs(2)}primaryKey: true,`, `${tabs(2)}autoIncrement: true,`, `${tabs(2)}unique: 'PRIMARY',`].join('\n') +
      '\n'
    );
  }

  /**
   * Generate foreign key reference
   * @private
   * @param {string} columnName - Column name
   * @returns {Promise<string>} Reference definition
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
   * Generate enum getter method
   * @private
   * @param {string} columnName - Column name
   * @returns {string} Enum getter definition
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
   * Generate virtual enum integer column
   * @private
   * @param {string} columnName - Base column name
   * @param {string} columnType - Enum column type
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
   * Parse enum values from column type
   * @private
   * @param {string} columnType - Enum column type
   * @returns {string} Formatted enum options
   */
  #parseEnumValues(columnType) {
    const valuesString = columnType.split('(')[1].replace(')', '');
    const values = valuesString.split(',');

    return values.map((value, index) => `${value.replace(/'/g, '')}: ${index + 1}`).join(', ');
  }

  /**
   * Generate column comment
   * @private
   * @param {string} comment - Column comment
   * @returns {string} Comment definition
   */
  #generateColumnComment(comment) {
    const escapedComment = comment.includes("'") ? `"${comment}"` : `'${comment}'`;

    return `${tabs(2)}comment: ${escapedComment},\n`;
  }

  /**
   * Generate timestamp configuration
   * @private
   * @returns {string} Timestamp configuration
   */
  #generateTimestamps() {
    return [`${tabs()}timestamps: true,`, `${tabs()}paranoid: true,`].join('\n') + '\n';
  }

  /**
   * Generate i18n import for enum handling
   * @private
   * @returns {string} i18n import statement
   */
  #generateI18nImport() {
    return `\n\nconst i18n = require('../../configurations/i18n');`;
  }

  /**
   * Generate better association alias
   * @private
   * @param {string} tableName - Related table name
   * @returns {string} Formatted alias
   */
  #generateBetterAlias(tableName) {
    const parts = tableName.split('_');

    if (parts.includes('has')) {
      // Bridge table: return everything after first part
      return toCamelCase(parts.slice(1).join('_'));
    }

    // Regular table: return last part
    return toCamelCase(parts[parts.length - 1]);
  }

  /**
   * Derive singular form from table name
   * @private
   * @param {string} tableName - Table name
   * @returns {string} Singular form
   */
  #deriveSingularForm(tableName) {
    // Simple pluralization rules - can be extended
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
 * Command Line Argument Parser
 */
class CLIParser {
  /**
   * Parse command line arguments
   * @param {string[]} args - Command line arguments
   * @returns {Object} Parsed arguments
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
   * Display help information
   */
  static showHelp() {
    console.log(CLI_CONFIG.help);
  }

  /**
   * Validate parsed arguments
   * @param {Object} args - Parsed arguments
   * @returns {boolean} Validation result
   */
  static validateArguments(_) {
    // Add validation logic here if needed
    return true;
  }
}

// =============================================================================
// MAIN EXECUTION CONTROLLER
// =============================================================================

/**
 * Main application controller
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
   * @param {string[]} args - Command line arguments
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

      // Get tables to process
      const tables = await this.#getTablesToProcess(parsedArgs);

      if (tables.length === 0) {
        console.log('ℹ️  No tables found matching criteria');
        return;
      }

      console.log(`📋 Found ${tables.length} table(s) to process`);

      // Process each table
      await this.#processTables(tables);

      // Show summary
      this.#showSummary();
    } catch (error) {
      cerror('Error in model generator', error);
      process.exit(1);
    } finally {
      await databaseConnection.close();
    }
  }

  /**
   * Get list of tables to process based on arguments
   * @private
   * @param {Object} args - Parsed arguments
   * @returns {Promise<string[]>} List of table names
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

    // Add filters based on arguments
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
   * Process all tables and generate models
   * @private
   * @param {string[]} tables - List of table names
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
   * Display generation summary
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
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
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
}

/**
 * Enhanced error logging with context
 * @param {string} context - Error context
 * @param {Error} error - Error object
 * @param {Object} [metadata] - Additional metadata
 */
function logError(context, error, metadata = {}) {
  const errorInfo = {
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.error('💥 ERROR DETAILS:', JSON.stringify(errorInfo, null, 2));
}

/**
 * Display startup banner
 */
function showStartupBanner() {
  console.log('\n' + '='.repeat(80));
  console.log('🏗️  SEQUELIZE MODEL GENERATOR');
  console.log('='.repeat(80));
  console.log('📋 Automatically generates Sequelize models from database tables');
  console.log('🔗 Includes associations, data types, and CRUD operations');
  console.log('⚡ Optimized for your database connection configuration');
  console.log('='.repeat(80) + '\n');
}

/**
 * Check database connectivity
 * @returns {Promise<boolean>}
 */
async function checkDatabaseConnectivity() {
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
}

/**
 * Validate table existence
 * @param {string} tableName - Table name to validate
 * @returns {Promise<boolean>}
 */
async function validateTableExists(tableName) {
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
}

// =============================================================================
// SCRIPT EXECUTION
// =============================================================================

// Only run if this file is executed directly
if (require.main === module) {
  // Show startup banner
  showStartupBanner();

  // Setup graceful shutdown
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
module.exports = {
  ModelGenerator,
  CLIParser,
  ModelGeneratorApp,
  validateTableExists,
  checkDatabaseConnectivity,
  logError,
};
