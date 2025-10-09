// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs'); // File system operations for template handling
const path = require('path'); // Path manipulation for cross-platform compatibility
const { promisify } = require('util'); // Utility function promisification

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Sequelize } = require('sequelize'); // ORM for database connection management

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { PATHS, PREFIXES } = require('../utils/constants.util'); // Application path constants
const { wrapLogging } = require('./debug.helper'); // Logging wrapper utility
const { toCamelCase, formatCapitalize } = require('../utils/strings.util'); // String transformation utility

// Promisified filesystem operations
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * SQL query templates for MySQL schema metadata inspection
 * @namespace SQL_QUERIES
 */
const SQL_QUERIES = {
  TABLE_COMMENT: (schema, table) =>
    `SELECT table_comment FROM information_schema.tables
     WHERE table_schema = '${schema}' AND table_name = '${table}'`,

  ALL_COLUMNS: (schema, table) =>
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = '${table}'
     ORDER BY ORDINAL_POSITION`,

  UPDATABLE_COLUMNS: (schema, table) =>
    `SELECT c.COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS c
     LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
       ON c.TABLE_SCHEMA = k.TABLE_SCHEMA
       AND c.TABLE_NAME = k.TABLE_NAME
       AND c.COLUMN_NAME = k.COLUMN_NAME
       AND k.CONSTRAINT_NAME = 'PRIMARY'
     WHERE c.TABLE_SCHEMA = '${schema}' AND c.TABLE_NAME = '${table}'
       AND k.COLUMN_NAME IS NULL
       AND c.COLUMN_NAME NOT IN ('created_at', 'updated_at', 'deleted_at')`,

  REQUIRED_COLUMNS: (schema, table) =>
    `SELECT c.COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS c
     LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
       ON c.TABLE_SCHEMA = k.TABLE_SCHEMA
       AND c.TABLE_NAME = k.TABLE_NAME
       AND c.COLUMN_NAME = k.COLUMN_NAME
       AND k.CONSTRAINT_NAME = 'PRIMARY'
     WHERE c.TABLE_SCHEMA = '${schema}' AND c.TABLE_NAME = '${table}'
       AND c.IS_NULLABLE = 'NO'
       AND c.COLUMN_DEFAULT IS NULL
       AND k.COLUMN_NAME IS NULL`,

  NULLABLE_OR_DEFAULT_COLUMNS: (schema, table) =>
    `SELECT c.COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS c
     LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
       ON c.TABLE_SCHEMA = k.TABLE_SCHEMA
       AND c.TABLE_NAME = k.TABLE_NAME
       AND c.COLUMN_NAME = k.COLUMN_NAME
       AND k.CONSTRAINT_NAME = 'PRIMARY'
     WHERE c.TABLE_SCHEMA = '${schema}' AND c.TABLE_NAME = '${table}'
       AND (c.IS_NULLABLE = 'YES' OR c.COLUMN_DEFAULT IS NOT NULL)
       AND k.COLUMN_NAME IS NULL
       AND c.COLUMN_NAME NOT IN ('created_at', 'updated_at', 'deleted_at')`,

  INDEXES: (schema, table) =>
    `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = '${table}'
       AND INDEX_NAME != 'PRIMARY'
       AND COLUMN_NAME NOT IN ('created_at', 'updated_at', 'deleted_at')`,

  FOREIGN_KEYS: (schema, table) =>
    `SELECT k.CONSTRAINT_NAME, s.INDEX_NAME,
            ANY_VALUE(k.COLUMN_NAME) AS COLUMN_NAME,
            k.REFERENCED_TABLE_NAME,
            ANY_VALUE(k.REFERENCED_COLUMN_NAME) AS REFERENCED_COLUMN_NAME,
            rc.UPDATE_RULE, rc.DELETE_RULE
     FROM information_schema.KEY_COLUMN_USAGE k
     LEFT JOIN information_schema.STATISTICS s
       ON k.TABLE_SCHEMA = s.TABLE_SCHEMA
       AND k.TABLE_NAME = s.TABLE_NAME
       AND k.COLUMN_NAME = s.COLUMN_NAME
     LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
       ON k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
       AND k.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
     WHERE k.TABLE_SCHEMA = '${schema}' AND k.TABLE_NAME = '${table}'
       AND k.REFERENCED_TABLE_NAME IS NOT NULL
     GROUP BY k.CONSTRAINT_NAME, s.INDEX_NAME, k.REFERENCED_TABLE_NAME,
              rc.UPDATE_RULE, rc.DELETE_RULE
     HAVING COUNT(DISTINCT k.REFERENCED_TABLE_NAME) = 1`,

  REFERENCES: (schema, table) =>
    `SELECT k.TABLE_NAME, k.CONSTRAINT_NAME,
            ANY_VALUE(k.COLUMN_NAME) AS COLUMN_NAME,
            k.REFERENCED_TABLE_NAME,
            ANY_VALUE(k.REFERENCED_COLUMN_NAME) AS REFERENCED_COLUMN_NAME,
            rc.UPDATE_RULE, rc.DELETE_RULE
     FROM information_schema.KEY_COLUMN_USAGE k
     LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
       ON k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
       AND k.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
     WHERE k.TABLE_SCHEMA = '${schema}' AND k.REFERENCED_TABLE_NAME = '${table}'
     GROUP BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.REFERENCED_TABLE_NAME,
              rc.UPDATE_RULE, rc.DELETE_RULE`,

  BRIDGES: (schema, table) =>
    `SELECT child.TABLE_NAME AS child_table,
            child.COLUMN_NAME AS foreign_key,
            other.REFERENCED_TABLE_NAME AS other_table,
            other.COLUMN_NAME AS other_key
     FROM information_schema.KEY_COLUMN_USAGE AS child
     LEFT JOIN information_schema.KEY_COLUMN_USAGE AS other
       ON child.TABLE_NAME = other.TABLE_NAME
       AND other.TABLE_SCHEMA = '${schema}'
       AND other.TABLE_NAME LIKE '%_has_%'
       AND other.REFERENCED_TABLE_NAME IS NOT NULL
       AND other.REFERENCED_TABLE_NAME <> '${table}'
     WHERE child.TABLE_SCHEMA = '${schema}'
       AND child.TABLE_NAME LIKE '%_has_%'
       AND child.REFERENCED_TABLE_NAME = '${table}'`,

  ENUMS: (schema, table) =>
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = '${table}'
       AND DATA_TYPE = 'enum'`,

  INDEX_DETAILS: (schema, table, column) =>
    `SELECT s.INDEX_NAME, k.REFERENCED_TABLE_NAME,
            k.REFERENCED_COLUMN_NAME, c.IS_NULLABLE
     FROM INFORMATION_SCHEMA.STATISTICS s
     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
       ON s.TABLE_SCHEMA = k.TABLE_SCHEMA
       AND s.TABLE_NAME = k.TABLE_NAME
       AND s.COLUMN_NAME = k.COLUMN_NAME
     JOIN INFORMATION_SCHEMA.COLUMNS c
       ON s.TABLE_SCHEMA = c.TABLE_SCHEMA
       AND s.TABLE_NAME = c.TABLE_NAME
       AND s.COLUMN_NAME = c.COLUMN_NAME
     WHERE s.TABLE_SCHEMA = '${schema}' AND s.TABLE_NAME = '${table}'
       AND s.COLUMN_NAME = '${column}'
       AND k.REFERENCED_TABLE_NAME IS NOT NULL`,

  COLUMN_DETAILS: (schema, table, column) =>
    `SELECT C.COLUMN_NAME, C.COLUMN_TYPE, C.COLUMN_DEFAULT, C.COLUMN_COMMENT, C.EXTRA,
            IF(C.COLUMN_KEY = 'PRI', 1, 0) AS \`PRIMARY\`,
            IF(EXISTS (
              SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS S
              WHERE S.TABLE_SCHEMA = '${schema}' AND S.TABLE_NAME = '${table}'
                AND S.COLUMN_NAME = C.COLUMN_NAME AND S.NON_UNIQUE = 0
                AND S.INDEX_NAME <> 'PRIMARY'
            ), 1, 0) AS \`UNIQUE\`,
            IF(EXISTS (
              SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS S
              WHERE S.TABLE_SCHEMA = '${schema}' AND S.TABLE_NAME = '${table}'
                AND S.COLUMN_NAME = C.COLUMN_NAME AND S.NON_UNIQUE = 1
            ), 1, 0) AS \`INDEX\`,
            IF(C.IS_NULLABLE = 'YES', 1, 0) AS \`NULLABLE\`
     FROM INFORMATION_SCHEMA.COLUMNS C
     WHERE C.TABLE_SCHEMA = '${schema}' AND C.TABLE_NAME = '${table}'
       AND C.COLUMN_NAME = '${column}'`,

  UNIQUE_DETAILS: (schema, table, column) =>
    `SELECT S.INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS S
     WHERE S.TABLE_SCHEMA = '${schema}' AND S.TABLE_NAME = '${table}'
       AND S.COLUMN_NAME = '${column}' AND S.NON_UNIQUE = 0`,

  REFERENCED_TABLE: (schema, table, column) =>
    `SELECT REFERENCED_TABLE_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = '${schema}'
       AND TABLE_NAME = '${table}'
       AND COLUMN_NAME = '${column}'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,

  FIND_TABLE_PATTERN: (schema, pattern) =>
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = '${schema}'
       AND TABLE_NAME LIKE '%_${pattern}%'`,
};

/**
 * Database CRUD Helper Class
 * @class CrudHelper
 */
class CrudHelper {
  /**
   * Creates a CrudHelper instance with database connection
   * @constructor
   */
  constructor() {
    const sequelize = require('../config/database/connection');

    // if (!sequelize) {
    //   throw new Error('Database connection is not properly configured');
    // }

    this.sequelize = sequelize;
    this.databaseName = this.sequelize.config.database;
  }

  /**
   * Execute a database query with proper error handling and logging
   * @private
   * @param {string} query - SQL query to execute
   * @param {string} logMessage - Descriptive message for logging
   * @param {boolean} [returnFirst=false] - Whether to return only first result
   * @returns {Promise<any>} Query results or first result if returnFirst is true
   */
  async executeQuery(query, logMessage, returnFirst = false) {
    try {
      const result = await this.sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        logging: wrapLogging(logMessage),
      });

      return returnFirst ? result[0] : result;
    } catch (error) {
      console.error(`Error executing query: ${logMessage}`, error);
      throw error;
    }
  }

  // =========================== TABLE INFORMATION METHODS =========================== //

  /**
   * Read table comment from database schema metadata
   * @param {string} table - Table name to inspect
   * @returns {Promise<string>} Table comment or empty string if none exists
   */
  async readTablesComment(table) {
    const result = await this.executeQuery(
      SQL_QUERIES.TABLE_COMMENT(this.databaseName, table),
      'Query table comment',
      true
    );

    return result?.TABLE_COMMENT || '';
  }

  // ========================= COLUMN QUERY METHODS ========================= //

  /**
   * Read all columns from a table
   * @param {string} table - Table name
   * @returns {Promise<{columns: string[], formatedColumns: string[]}>} Column information
   */
  async readAllColumns(table) {
    return await this.searchColumns(SQL_QUERIES.ALL_COLUMNS(this.databaseName, table), 'Query all columns of a table');
  }

  /**
   * Read updatable columns (excluding primary keys and timestamps)
   * @param {string} table - Table name
   * @returns {Promise<{columns: string[], formatedColumns: string[]}>} Column information
   */
  async readUpdatableColumns(table) {
    return await this.searchColumns(
      SQL_QUERIES.UPDATABLE_COLUMNS(this.databaseName, table),
      'Query updatable columns of a table (excluding primary key and timestamps)'
    );
  }

  /**
   * Read required columns (non-nullable, no default, not primary key)
   * @param {string} table - Table name
   * @returns {Promise<{columns: string[], formatedColumns: string[]}>} Column information
   */
  async readRequiredColumns(table) {
    return await this.searchColumns(
      SQL_QUERIES.REQUIRED_COLUMNS(this.databaseName, table),
      'Query required columns of a table (excluding primary key)'
    );
  }

  /**
   * Read nullable or default columns
   * @param {string} table - Table name
   * @returns {Promise<{columns: string[], formatedColumns: string[]}>} Column information
   */
  async readNullableOrDefaultColumns(table) {
    return await this.searchColumns(
      SQL_QUERIES.NULLABLE_OR_DEFAULT_COLUMNS(this.databaseName, table),
      'Query nullable or default columns of a table (excluding primary key and timestamps)'
    );
  }

  /**
   * Read enum columns from a table
   * @param {string} table - Table name
   * @returns {Promise<{columns: string[], formatedColumns: string[]}>} Column information
   */
  async searchEnums(table) {
    return await this.searchColumns(SQL_QUERIES.ENUMS(this.databaseName, table), 'Query enums of a table');
  }

  // =========================== INDEX AND RELATIONSHIP METHODS =========================== //

  /**
   * Search indexes of a table
   * @param {string} table - Table name
   * @returns {Promise<{columns: string[], formatedColumns: string[]}>} Column information
   */
  async searchIndexes(table) {
    return await this.searchColumns(SQL_QUERIES.INDEXES(this.databaseName, table), 'Query indexes of a table');
  }

  /**
   * Search foreign keys of a table
   * @param {string} table - Table name
   * @returns {Promise<any[]>} Foreign key information
   */
  async searchForeignKeys(table) {
    return await this.executeQuery(SQL_QUERIES.FOREIGN_KEYS(this.databaseName, table), 'Query foreign keys of a table');
  }

  /**
   * Search tables that reference this table
   * @param {string} table - Table name
   * @returns {Promise<any[]>} Reference information
   */
  async searchReferences(table) {
    return await this.executeQuery(SQL_QUERIES.REFERENCES(this.databaseName, table), 'Query references of a table');
  }

  /**
   * Search bridge tables (many-to-many relationships)
   * @param {string} table - Table name
   * @returns {Promise<any[]>} Bridge table information
   */
  async searchBridges(table) {
    return await this.executeQuery(SQL_QUERIES.BRIDGES(this.databaseName, table), 'Query "bridges" of a table');
  }

  /**
   * Get detailed information about an index
   * @param {string} table - Table name
   * @param {string} column - Column name
   * @returns {Promise<any[]>} Index details
   */
  async detailsIndex(table, column) {
    return await this.executeQuery(
      SQL_QUERIES.INDEX_DETAILS(this.databaseName, table, column),
      'Query details of an index'
    );
  }

  /**
   * Get detailed information about a column
   * @param {string} table - Table name
   * @param {string} column - Column name
   * @returns {Promise<any>} Column details
   */
  async detailsColumn(table, column) {
    return await this.executeQuery(
      SQL_QUERIES.COLUMN_DETAILS(this.databaseName, table, column),
      'Query details of a column',
      true
    );
  }

  /**
   * Get unique constraint details for a column
   * @param {string} table - Table name
   * @param {string} column - Column name
   * @returns {Promise<string>} Index name
   */
  async uniqueDetails(table, column) {
    const result = await this.executeQuery(
      SQL_QUERIES.UNIQUE_DETAILS(this.databaseName, table, column),
      'Query unique details of a column',
      true
    );
    return result?.INDEX_NAME || '';
  }

  /**
   * Execute a column search query and format results
   * @private
   * @param {string} query - SQL query
   * @param {string} logMessage - Log message
   * @returns {Promise<{columns: string[], formatedColumns: string[]}>} Formatted column information
   */
  async searchColumns(query, logMessage) {
    const columns = await this.executeQuery(query, logMessage);
    return this.formatColumns(columns);
  }

  /**
   * Format column results into both original and camelCase formats
   * @private
   * @param {Array<{COLUMN_NAME: string}>} searchedColumns - Raw column data from database
   * @returns {{columns: string[], formatedColumns: string[]}} Formatted column information
   */
  formatColumns(searchedColumns) {
    const columns = new Set();
    const formatedColumns = new Set();

    for (const column of searchedColumns) {
      const { COLUMN_NAME } = column;

      if (COLUMN_NAME) {
        columns.add(COLUMN_NAME);
        formatedColumns.add(toCamelCase(COLUMN_NAME));
      }
    }

    return {
      columns: Array.from(columns),
      formatedColumns: Array.from(formatedColumns),
    };
  }

  /**
   * Extract prefix information from table name
   * @param {string} tableName - Full table name with prefix
   * @returns {{prefix: string, groupName: string, tagName: string, pluralName: string}}
   */
  extractPrefixInfo(tableName) {
    const parts = tableName.split('_');
    const prefix = parts[0];
    const groupName = PREFIXES[prefix.toUpperCase()] || 'general';
    const tagName = formatCapitalize(groupName);

    const tableNameParts = parts.slice(1);
    const pluralName = toCamelCase(tableNameParts.join('_'));

    return { prefix, groupName, tagName, pluralName };
  }

  /**
   * Check if a field should be skipped in generation
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if field should be skipped
   */
  shouldSkipField(fieldName) {
    const skipFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt'];
    return skipFields.includes(fieldName);
  }

  /**
   * Check if a column is a foreign key
   * @param {string} columnName - Column name
   * @param {Object} columnDetails - Column details object
   * @returns {boolean} True if column is a foreign key
   */
  isForeignKey(columnName, columnDetails) {
    const isForeignKeyByName = columnName.endsWith('_id');
    const isForeignKeyByConstraint = columnDetails.COLUMN_KEY && columnDetails.COLUMN_KEY.toUpperCase() === 'MUL';

    return Boolean(isForeignKeyByName || isForeignKeyByConstraint);
  }

  /**
   * Get the referenced table for a foreign key column
   * @param {string} tableName - Source table name
   * @param {string} columnName - Foreign key column name
   * @returns {Promise<string|null>} Referenced table name or null
   */
  async getReferencedTable(tableName, columnName) {
    try {
      const result = await this.executeQuery(
        SQL_QUERIES.REFERENCED_TABLE(this.databaseName, tableName, columnName),
        `Get referenced table for ${columnName}`
      );

      if (result && result.length > 0) {
        return result[0].REFERENCED_TABLE_NAME;
      }

      if (columnName.endsWith('_id')) {
        const baseName = columnName.replace('_id', '');
        return await this.findTableByPattern(baseName);
      }

      return null;
    } catch (error) {
      console.warn(`Could not determine referenced table for ${columnName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Find a table that matches a naming pattern
   * @param {string} baseName - Base name to search for
   * @returns {Promise<string|null>} Matched table name or null
   */
  async findTableByPattern(baseName) {
    try {
      const result = await this.executeQuery(
        SQL_QUERIES.FIND_TABLE_PATTERN(this.databaseName, baseName),
        `Find table pattern for ${baseName}`
      );

      if (result && result.length > 0) {
        const patterns = [`${baseName}s`, `${baseName}`];

        for (const pattern of patterns) {
          const match = result.find((row) => row.TABLE_NAME.endsWith(`_${pattern}`));
          if (match) {
            return match.TABLE_NAME;
          }
        }

        return result[0].TABLE_NAME;
      }

      return null;
    } catch (error) {
      console.warn(`Could not find table pattern for ${baseName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if a field is required based on column details
   * @param {string} columnName - Column name
   * @param {Object} columnDetails - Column details object
   * @returns {boolean} True if field is required
   */
  isFieldRequired(columnName, columnDetails) {
    if (this.shouldSkipField(columnName)) return false;
    if (columnDetails.EXTRA && columnDetails.EXTRA.toLowerCase().includes('auto_increment')) return false;
    if (columnDetails.COLUMN_KEY && columnDetails.COLUMN_KEY.toUpperCase() === 'PRI') return false;

    const notNullable = columnDetails.NULLABLE === '0';
    const hasDefault = columnDetails.COLUMN_DEFAULT !== null && columnDetails.COLUMN_DEFAULT !== undefined;

    return notNullable && !hasDefault;
  }

  /**
   * Generate method names for CRUD operations
   * @param {string} singularName - Singular entity name
   * @param {string} pluralName - Plural entity name
   * @returns {Object} Object with method names
   */
  generateMethodNames(singularName, pluralName) {
    const capitalizedSingular = formatCapitalize(singularName);
    const capitalizedPlural = formatCapitalize(pluralName);

    return {
      create: `create${capitalizedSingular}`,
      updateStatus: `update${capitalizedPlural}Status`,
      list: `getList${capitalizedPlural}`,
      details: `get${capitalizedSingular}Details`,
      update: `update${capitalizedSingular}`,
      delete: `delete${capitalizedSingular}`,
    };
  }

  // =========================== FILE OPERATIONS =========================== //

  /**
   * Read a template file
   * @param {string} folder - Template folder
   * @param {string} name - Template name
   * @returns {Promise<string>} Template content
   */
  async getTemplate(folder, name) {
    try {
      const templatePath = path.join(PATHS.TEMPLATES, folder, `${name}.template.js`);
      return await readFile(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading template: ${folder}/${name}`, error);
      throw error;
    }
  }

  /**
   * Create a folder if it doesn't exist
   * @param {string} file - Base path key
   * @param {string} group - Group folder
   * @param {string} name - Folder name
   * @returns {Promise<string>} Created folder path
   */
  async createFolder(file, group, name) {
    const folderPath = path.join(PATHS[file], group, name);
    return await this.ensureDirectoryExists(folderPath);
  }

  /**
   * Create a models folder if it doesn't exist
   * @param {string} group - Group name
   * @returns {Promise<string>} Created folder path
   */
  async createModelsFolder(group) {
    const folderPath = path.join('sync_models', group);
    return await this.ensureDirectoryExists(folderPath);
  }

  /**
   * Create a file with content
   * @param {string} folderPath - Target folder path
   * @param {string} name - File name (without extension)
   * @param {string} content - File content
   * @returns {Promise<string>} Created file path
   */
  async createFile(folderPath, name, content) {
    const filePath = path.join(folderPath, `${name}.js`);
    return await this.writeFileIfNotExists(filePath, content);
  }

  /**
   * Create a model file with content
   * @param {string} folderPath - Target folder path
   * @param {string} name - File name (without extension)
   * @param {string} content - File content
   * @returns {Promise<string>} Created file path
   */
  async createModelsFile(folderPath, name, content) {
    const filePath = path.join(folderPath, `${name}.model.js`);
    await writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  /**
   * Ensure directory exists, create if it doesn't
   * @private
   * @param {string} dirPath - Directory path
   * @returns {Promise<string>} Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log('Directory created:', dirPath);
      } else {
        console.log('Directory already exists, skipping creation:', dirPath);
      }
      return dirPath;
    } catch (error) {
      console.error(`Error creating directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Write file only if it doesn't exist
   * @private
   * @param {string} filePath - File path
   * @param {string} content - File content
   * @returns {Promise<string>} File path
   */
  async writeFileIfNotExists(filePath, content) {
    try {
      if (!fs.existsSync(filePath)) {
        await writeFile(filePath, content, 'utf-8');
        console.log('File created:', filePath);
      } else {
        console.log('File already exists, skipping creation:', filePath);
      }
      return filePath;
    } catch (error) {
      console.error(`Error creating file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Determine if a tinyint(1) column should be treated as TINYINT(1) instead of BOOLEAN
   * @param {string} columnName - Column name to validate
   * @param {string} columnType - Column type from database (e.g., 'tinyint(1)')
   * @returns {boolean} True if should be TINYINT(1), false if should be BOOLEAN
   */
  shouldBeTinyInt(columnName, columnType) {
    // First check: must be tinyint(1)
    if (!columnType || !columnType.toLowerCase().includes('tinyint(1)')) {
      return false;
    }

    const lowerName = columnName.toLowerCase();

    // Check if it matches boolean naming conventions
    const isBooleanName =
      lowerName.startsWith('is_') || // is_active, is_enabled
      lowerName.includes('require') || // require_approval, requires_auth
      lowerName.startsWith('has_') || // has_permission
      lowerName.endsWith('_has') || // user_has, role_has
      lowerName.endsWith('_has_'); // user_has_roles, role_has_user

    // If it matches boolean conventions, it should be BOOLEAN (return false)
    // If it doesn't match, it should be TINYINT(1) (return true)
    return !isBooleanName;
  }

  /**
   * Set CRUD method names in template based on entity names
   * @param {string} template - Template content with placeholder method names
   * @param {string} name - Plural entity name (e.g., 'users')
   * @param {string} singular - Singular entity name (e.g., 'user')
   * @returns {string} Template with replaced method names in camelCase
   */
  setCrudName(template, name, singular) {
    const methodNames = {
      create: toCamelCase(`create ${singular}`),
      list: toCamelCase(`read All ${name}`),
      details: toCamelCase(`read one ${singular}`),
      update: toCamelCase(`update ${singular}`),
      status: toCamelCase(`update ${name} status`),
      delete: toCamelCase(`delete ${singular}`),
    };

    // Replace static method declarations
    template = template.replace(/static async updateStatus\(/g, `static async ${methodNames.status}(`);
    template = template.replace(/static async create/g, `static async ${methodNames.create}`);
    template = template.replace(/static async readAll/g, `static async ${methodNames.list}`);
    template = template.replace(/static async readOne/g, `static async ${methodNames.details}`);
    template = template.replace(/static async update\(/g, `static async ${methodNames.update}(`);
    template = template.replace(/static async delete/g, `static async ${methodNames.delete}`);

    // Replace method calls
    template = template.replace(/\.updateStatus\(/g, `.${methodNames.status}(`);
    template = template.replace(/\.create\(/g, `.${methodNames.create}(`);
    template = template.replace(/\.readAll\(/g, `.${methodNames.list}(`);
    template = template.replace(/\.readOne\(/g, `.${methodNames.details}(`);
    template = template.replace(/\.update\(/g, `.${methodNames.update}(`);
    template = template.replace(/\.delete\(/g, `.${methodNames.delete}(`);

    // Fix logging method calls to use original 'create' method
    template = template.replace(`await logsCreation.${methodNames.create}`, 'await logsCreation.create');
    template = template.replace(`await logsUpdate.${methodNames.create}`, 'await logsUpdate.create');
    template = template.replace(`await logsDeletion.${methodNames.create}`, 'await logsDeletion.create');

    return template;
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = CrudHelper;
