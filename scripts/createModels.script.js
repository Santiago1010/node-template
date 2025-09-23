#!/usr/bin/env node
'use strict';

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

const DATA_TYPE_MAPPINGS = Object.freeze({
  mysql: {
    varchar: 'STRING',
    char: 'STRING',
    text: 'TEXT',
    longtext: "TEXT('long')",
    mediumtext: 'TEXT',
    tinytext: "TEXT('tiny')",

    int: 'INTEGER',
    integer: 'INTEGER',
    tinyint: 'TINYINT',
    smallint: 'SMALLINT',
    bigint: 'BIGINT',
    decimal: 'DECIMAL',
    numeric: 'DECIMAL',
    double: 'DOUBLE',
    float: 'FLOAT',

    varbinary: 'BLOB',
    blob: 'BLOB',
    tinyblob: 'BLOB',
    mediumblob: 'BLOB',
    longblob: 'BLOB',
    binary: 'STRING.BINARY',

    timestamp: 'DATE',
    datetime: 'DATE',
    date: 'DATEONLY',
    time: 'TIME',
    year: 'YEAR',

    enum: 'ENUM',
    json: 'JSON',

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

const TIMESTAMP_COLUMNS = Object.freeze(new Set(['created_at', 'updated_at', 'deleted_at']));

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

class ModelGenerator extends CrudHelper {
  #specialColumns = TIMESTAMP_COLUMNS;
  #generationStats = {
    processed: 0,
    successful: 0,
    failed: 0,
    startTime: null,
    endTime: null,
  };

  constructor(tableName, singularForm = null) {
    super();

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('tableName must be a non-empty string');
    }

    this.tableName = tableName;
    this.singularForm = singularForm || this.#deriveSingularForm(tableName);
    this.modelName = toCamelCase(tableName);

    const tableParts = tableName.split('_');
    this.entityName = tableParts.slice(1).join('_');
    this.groupName = PREFIXES[tableParts[0].toUpperCase()] || 'general';

    this.features = {
      softDelete: false,
      hasAssociations: false,
      hasEnums: false,
      hasVirtualColumns: false,
    };

    this.sequelize = databaseConnection;
  }

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

  async #buildModelContent() {
    let template = await this.getTemplate('models', 'model');

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

    for (const [placeholder, value] of Object.entries(replacements)) {
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }

    template = template.replace(/models/g, this.features.hasAssociations ? 'models' : '_');

    return this.setCrudName(template, this.entityName, this.singularForm);
  }

  async #generateSchema() {
    const { columns, formatedColumns } = await this.readAllColumns(this.tableName);

    this.features.softDelete = columns.includes('deleted_at') || formatedColumns.includes('deletedAt');

    const schemaDefinitions = [];

    for (let i = 0; i < columns.length; i++) {
      const columnName = columns[i];
      const formattedName = formatedColumns[i];

      const columnDetails = await this.detailsColumn(this.tableName, columnName);
      const columnSchema = await this.#generateColumnDefinition(columnName, formattedName, columnDetails);

      schemaDefinitions.push(columnSchema);

      if (String(columnDetails.COLUMN_TYPE || '').includes('enum')) {
        const virtualColumn = this.#generateEnumVirtualColumn(formattedName, columnDetails.COLUMN_TYPE);
        schemaDefinitions.push(virtualColumn);
      }
    }

    return schemaDefinitions.join(',\n');
  }

  async #generateColumnDefinition(columnName, formattedName, columnDetails) {
    const { COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT, PRIMARY, UNIQUE, INDEX, NULLABLE, EXTRA } = columnDetails;

    // Robust detection for metadata fields produced by different DB drivers
    const columnKey = (columnDetails.COLUMN_KEY || '').toString().toUpperCase();
    const isNullable = columnDetails.IS_NULLABLE === 'YES' || NULLABLE === 'YES' || NULLABLE === 1 || NULLABLE === '1';
    const isPrimary = columnKey === 'PRI' || PRIMARY === 1 || PRIMARY === '1' || PRIMARY === true;
    const isUnique = columnKey === 'UNI' || UNIQUE === 1 || UNIQUE === '1' || UNIQUE === true;
    const hasIndex = INDEX === 1 || INDEX === '1' || columnKey === 'MUL';
    const isEnum = String(COLUMN_TYPE || '')
      .toLowerCase()
      .includes('enum');
    const isAutoIncrement = EXTRA && EXTRA.toString().includes('auto_increment');
    const requiresFieldMapping = columnName !== formattedName;

    if (isEnum) this.features.hasEnums = true;

    let definition = `${tabs()}${formattedName}: {\n`;

    definition += `${tabs(2)}type: DataTypes.${this.#mapDataType(COLUMN_TYPE, columnName)},\n`;

    definition += `${tabs(2)}allowNull: ${isNullable},\n`;

    if (COLUMN_DEFAULT !== undefined && COLUMN_DEFAULT !== null) {
      definition += `${tabs(2)}defaultValue: ${this.#formatDefaultValue(columnName, COLUMN_DEFAULT, isNullable)},\n`;
    } else if (isNullable) {
      definition += `${tabs(2)}defaultValue: null,\n`;
    }

    // Special handling for timestamp on update
    if (columnName === 'updated_at') {
      definition += `${tabs(2)}onUpdate: DataTypes.NOW,\n`;
    }

    if (isPrimary) {
      console.clear();
      console.log(columnDetails);
      console.log(isAutoIncrement);

      definition += `${tabs(2)}primaryKey: true,\n`;
      if (isAutoIncrement) {
        definition += `${tabs(2)}autoIncrement: true,\n`;
      }
      definition += `${tabs(2)}unique: 'PRIMARY',\n`;
    }

    if (isUnique && !isPrimary) {
      const uniqueIndexName = await this.uniqueDetails(this.tableName, columnName);
      definition += `${tabs(2)}unique: '${uniqueIndexName || columnName + '_UN'}',\n`;
    }

    if (hasIndex && !isPrimary && !isUnique) {
      const referenceDef = await this.#generateIndexReference(columnName);
      if (referenceDef) definition += referenceDef;
    }

    if (isEnum) {
      definition += this.#generateEnumGetter(formattedName, COLUMN_TYPE);
    }

    if (COLUMN_COMMENT) {
      definition += this.#generateColumnComment(COLUMN_COMMENT);
    }

    if (requiresFieldMapping) {
      definition += `${tabs(2)}field: '${columnName}',\n`;
    }

    definition = definition.trimEnd();
    if (definition.endsWith(',')) {
      definition = definition.slice(0, -1);
    }

    definition += `\n${tabs()}}`;

    return definition;
  }

  #mapDataType(columnType, columnName) {
    const [baseTypeRaw, sizeInfo] = (columnType || '').split('(');
    const baseType = (baseTypeRaw || '').toLowerCase();
    const cleanSize = sizeInfo ? sizeInfo.replace(')', '') : null;

    const dialect = (databaseConnection && databaseConnection.getDialect && databaseConnection.getDialect()) || 'mysql';
    const typeMap = DATA_TYPE_MAPPINGS[dialect] || DATA_TYPE_MAPPINGS.mysql;

    let sequelizeType = typeMap[baseType] || 'STRING';

    // tinyint special handling
    if (baseType === 'tinyint') {
      if (!cleanSize) {
        // default tinyint size preference for readability
        sequelizeType += `(2)`;
      } else if (cleanSize === '1') {
        const normalizedName = (columnName || '').toLowerCase();
        if (normalizedName.startsWith('is_') || normalizedName.endsWith('_is') || normalizedName.includes('_is_')) {
          sequelizeType = 'BOOLEAN';
        } else {
          sequelizeType += `(${cleanSize})`;
        }
      } else {
        sequelizeType += `(${cleanSize})`;
      }
    } else if (baseType === 'longtext') {
      sequelizeType = "TEXT('long')";
    } else if (baseType === 'enum') {
      // Preserve the original casing of the enum values (cleanSize includes the quoted values)
      if (cleanSize) {
        sequelizeType = `ENUM(${cleanSize})`;
      } else {
        // fallback: try to extract values from the original columnType, otherwise return it as-is
        const match = String(columnType).match(/\((.*)\)/);
        sequelizeType = match && match[1] ? `ENUM(${match[1]})` : String(columnType);
      }
    } else if (
      cleanSize &&
      !sequelizeType.includes('(') &&
      !['BOOLEAN', 'DATE', 'DATEONLY', 'TIME', 'JSON', 'GEOMETRY'].includes(sequelizeType)
    ) {
      sequelizeType += `(${cleanSize})`;
    }

    return sequelizeType;
  }

  #formatDefaultValue(columnName, defaultValue) {
    // Use snake_case detection for special timestamp columns
    if (this.#specialColumns.has(columnName)) {
      return 'DataTypes.NOW';
    }

    if (defaultValue === null || defaultValue === 'NULL') {
      return 'null';
    }

    if (typeof defaultValue === 'string' && defaultValue.includes('CURRENT_TIMESTAMP')) {
      return 'DataTypes.NOW';
    }

    if (typeof defaultValue === 'string') {
      const escapedValue = defaultValue.replace(/'/g, "\\'");
      return `'${escapedValue}'`;
    }

    if (defaultValue === true || defaultValue === false) {
      return defaultValue.toString();
    }

    if (!isNaN(defaultValue) && defaultValue !== '') {
      return String(defaultValue);
    }

    return `'${defaultValue}'`;
  }

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

  #generateEnumGetter(columnName) {
    // Use the formatted name in the getter so the variable names are readable in the generated model
    return (
      [
        `${tabs(2)}get() {`,
        `${tabs(3)}const ${columnName} = this.getDataValue('${columnName}');`,
        `${tabs(3)}const translated = i18n.__('enums.${columnName}.' + ${columnName});`,
        `\n${tabs(3)}return { original: ${columnName}, translated };`,
        `${tabs(2)}},`,
      ].join('\n') + '\n'
    );
  }

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
      `\n${tabs(3)}return options[${columnName}];`,
      `${tabs(2)}},`,
      `${tabs(2)}set(_) {`,
      `${tabs(3)}throw new Error('You cannot assign a value to a virtual column.');`,
      `${tabs(2)}}`,
      `${tabs()}}`,
    ].join('\n');
  }

  #parseEnumValues(columnType) {
    const valuesString = (columnType || '').split('(')[1] ? (columnType || '').split('(')[1].replace(')', '') : '';
    if (!valuesString) return '';
    const values = valuesString.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim());

    return values.map((value, index) => `${value.replace(/'/g, '')}: ${index + 1}`).join(', ');
  }

  #generateColumnComment(comment) {
    const escapedComment = comment.includes("'") ? `"${comment}"` : `'${comment}'`;

    return `${tabs(2)}comment: ${escapedComment},\n`;
  }

  #generateTimestamps() {
    return [`${tabs()}timestamps: true,`, `${tabs()}paranoid: true,`].join('\n') + '\n';
  }

  #generateI18nImport() {
    return `\n\nconst i18n = require('../../config/i18n');`;
  }

  #generateBetterAlias(tableName) {
    const parts = tableName.split('_');

    if (parts.includes('has')) {
      return toCamelCase(parts.slice(1).join('_'));
    }

    return toCamelCase(parts[parts.length - 1]);
  }

  #deriveSingularForm(tableName) {
    if (tableName.endsWith('ies')) {
      return tableName.slice(0, -3) + 'y';
    }
    if (tableName.endsWith('s')) {
      return tableName.slice(0, -1);
    }
    return tableName;
  }
}

class CLIParser {
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

  static showHelp() {
    console.log(CLI_CONFIG.help);
  }

  static validateArguments(_) {
    return true;
  }
}

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

      const tables = await this.#getTablesToProcess(parsedArgs);

      if (tables.length === 0) {
        console.log('ℹ️  No tables found matching criteria');
        return;
      }

      console.log(`📋 Found ${tables.length} table(s) to process`);

      await this.#processTables(tables);

      this.#showSummary();
    } catch (error) {
      cerror('Error in model generator', error);
      process.exit(1);
    } finally {
      await databaseConnection.close();
    }
  }

  async #getTablesToProcess(args) {
    const sequelize = databaseConnection;
    const { config } = sequelize;

    let query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${config.database}'
        AND table_type = 'BASE TABLE'
    `;

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

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
};

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

const showStartupBanner = () => {
  console.log('\n' + '='.repeat(80));
  console.log('🏗️  SEQUELIZE MODEL GENERATOR');
  console.log('='.repeat(80));
  console.log('📋 Automatically generates Sequelize models from database tables');
  console.log('🔗 Includes associations, data types, and CRUD operations');
  console.log('⚡ Optimized for your database connection configuration');
  console.log('='.repeat(80) + '\n');
};

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

if (require.main === module) {
  showStartupBanner();
  setupGracefulShutdown();
  const args = process.argv.slice(2);
  const app = new ModelGeneratorApp();
  app.run(args).catch((error) => {
    logError('Application startup', error);
    console.error('\n💥 Application failed to start. Please check the error details above.');
    process.exit(1);
  });
}

module.exports = {
  ModelGenerator,
  CLIParser,
  ModelGeneratorApp,
  validateTableExists,
  checkDatabaseConnectivity,
  logError,
};
