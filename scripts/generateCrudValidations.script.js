#!/usr/bin/env node
'use strict';

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CrudHelper = require('../helpers/crud.helper');
const { PREFIXES } = require('../helpers/constants.helper');
const { cerror } = require('../helpers/debug.helper');
const { toCamelCase, toPascalCase } = require('../helpers/strings.helper');

// =============================================================================
// SCRIPT CONFIGURATION
// =============================================================================
const SCRIPT_NAME = 'Generate CRUD Validations';
const REQUIRED_ARGS = 2;

class CrudValidationsGenerator {
  constructor() {
    this.crudHelper = new CrudHelper();
    this.startTime = performance.now();
    this.foreignKeyReferences = new Map();
    this.enumColumns = new Map();
  }

  async run() {
    try {
      console.log(`\n🚀 Starting ${SCRIPT_NAME}...`);

      const { tableName, singularName } = this.validateArguments();
      const { groupName, pluralName } = this.extractPrefixInfo(tableName);
      const tableData = await this.analyzeTable(tableName);

      // Analyze relationships and enums
      await this.analyzeForeignKeys(tableData);
      await this.analyzeEnums(tableData);

      const validationsContent = await this.generateValidations(tableData, singularName, pluralName);
      await this.saveValidations(validationsContent, tableName, groupName);

      const endTime = performance.now();
      const executionTime = ((endTime - this.startTime) / 1000).toFixed(2);

      console.log(`\n✅ ${SCRIPT_NAME} completed successfully!`);
      console.log(`⏱️  Execution time: ${executionTime} seconds`);
    } catch (error) {
      cerror(`❌ ${SCRIPT_NAME} failed:`, error);
      process.exit(1);
    }
  }

  validateArguments() {
    const args = process.argv.slice(2);

    if (args.length !== REQUIRED_ARGS) {
      console.error(`\n❌ Error: Invalid number of arguments.`);
      console.error(`📋 Usage: npx generate-crud-validations <table_name> <singular_name>`);
      console.error(`📝 Example: npx generate-crud-validations usr_users user`);
      process.exit(1);
    }

    const [tableName, singularName] = args;

    if (!tableName || !singularName) {
      console.error(`\n❌ Error: Both table name and singular name are required.`);
      process.exit(1);
    }

    console.log(`📊 Table: ${tableName}`);
    console.log(`📝 Singular: ${singularName}`);

    return { tableName, singularName };
  }

  extractPrefixInfo(tableName) {
    const parts = tableName.split('_');
    const prefix = parts[0].toUpperCase();
    const groupName = PREFIXES[prefix] || 'general';

    // Extract plural name from table name (excluding prefix)
    const tableNameParts = parts.slice(1);
    const pluralName = toCamelCase(tableNameParts.join('_'));

    console.log(`📂 Prefix: ${prefix}`);
    console.log(`📁 Group: ${groupName}`);
    console.log(`📚 Plural: ${pluralName}`);

    return { prefix, groupName, pluralName };
  }

  async analyzeTable(tableName) {
    try {
      console.log(`🔍 Analyzing table: ${tableName}`);

      const allColumns = await this.crudHelper.readAllColumns(tableName);
      const requiredColumns = await this.crudHelper.readRequiredColumns(tableName);
      const nullableColumns = await this.crudHelper.readNullableOrDefaultColumns(tableName);
      const enumColumns = await this.crudHelper.searchEnums(tableName);

      const columnDetails = {};
      for (const columnName of allColumns.columns) {
        if (this.shouldSkipField(columnName)) continue;
        const details = await this.crudHelper.detailsColumn(tableName, columnName);
        if (details) columnDetails[columnName] = details;
      }

      console.log(`📋 Analyzed ${Object.keys(columnDetails).length} columns`);

      return {
        tableName,
        allColumns: allColumns.columns,
        requiredColumns: requiredColumns.columns,
        nullableColumns: nullableColumns.columns,
        enumColumns: enumColumns.columns,
        columnDetails,
      };
    } catch (error) {
      throw new Error(`Failed to analyze table: ${error.message}`);
    }
  }

  shouldSkipField(fieldName) {
    const skipFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt'];
    return skipFields.includes(fieldName);
  }

  async analyzeForeignKeys(tableData) {
    console.log(`🔗 Analyzing foreign keys for table: ${tableData.tableName}`);

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      if (this.isForeignKey(columnName, columnDetails)) {
        try {
          const referencedTable = await this.getReferencedTable(tableData.tableName, columnName);
          if (referencedTable) {
            const modelName = toCamelCase(referencedTable);
            this.foreignKeyReferences.set(columnName, {
              referencedTable,
              modelName,
            });
            console.log(`🔗 Foreign key detected: ${columnName} -> ${referencedTable} (${modelName})`);
          }
        } catch (error) {
          console.warn(`⚠️  Could not analyze foreign key ${columnName}: ${error.message}`);
        }
      }
    }
  }

  async analyzeEnums(tableData) {
    console.log(`📝 Analyzing enums for table: ${tableData.tableName}`);

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();
      if (columnType.includes('enum')) {
        const enumMatch = columnType.match(/enum\((.+)\)/);
        if (enumMatch) {
          const enumValues = enumMatch[1].split(',').map((v) => v.trim().replace(/['"]/g, ''));
          this.enumColumns.set(columnName, enumValues);
          console.log(`📝 Enum detected: ${columnName} -> [${enumValues.join(', ')}]`);
        }
      }
    }
  }

  isForeignKey(columnName, columnDetails) {
    const isForeignKeyByName = columnName.endsWith('_id');
    const isForeignKeyByConstraint = columnDetails.COLUMN_KEY && columnDetails.COLUMN_KEY.toUpperCase() === 'MUL';
    return isForeignKeyByName || isForeignKeyByConstraint;
  }

  async getReferencedTable(tableName, columnName) {
    try {
      const query = `
        SELECT REFERENCED_TABLE_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          TABLE_SCHEMA = '${this.crudHelper.databaseName}'
          AND TABLE_NAME = '${tableName}'
          AND COLUMN_NAME = '${columnName}'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      const result = await this.executeQuery(query);

      if (result && result.length > 0) {
        return result[0].REFERENCED_TABLE_NAME;
      }

      // Fallback: try to guess the table name from the column name
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

  async findTableByPattern(baseName) {
    try {
      const query = `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = '${this.crudHelper.databaseName}'
        AND TABLE_NAME LIKE '%_${baseName}%'
      `;

      const result = await this.executeQuery(query);

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
      cerror(`Could not find table pattern for ${baseName}`, error.message);
      return null;
    }
  }

  async executeQuery(query) {
    try {
      const { Sequelize } = require('sequelize');
      const result = await this.crudHelper.sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
        logging: false,
      });
      return result;
    } catch (error) {
      console.warn(`Database query failed:`, error.message);
      return null;
    }
  }

  getModelNameFromTable(tableName) {
    const parts = tableName.split('_');
    const modelParts = parts.slice(1);
    return this.capitalize(toCamelCase(modelParts.join('_')));
  }

  async generateValidations(tableData, singularName, pluralName) {
    try {
      const templatePath = path.resolve(__dirname, '../templates/validations/crud.template.js');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      let validationsContent = fs.readFileSync(templatePath, 'utf-8');
      const mainModelName = toCamelCase(tableData.tableName);
      const imports = this.generateImports(tableData);
      const schemas = this.generateSchemas(tableData, mainModelName);

      // Replace placeholders
      validationsContent = validationsContent.replace(/\{\{MAIN_MODEL\}\}/g, mainModelName);
      validationsContent = validationsContent.replace(/\{\{MORE_MODELS\}\}/g, imports.moreModels);

      // Add custom schemas
      validationsContent = this.insertCreateSchema(validationsContent, schemas.createSchema);
      validationsContent = this.insertUpdateStatusSchema(validationsContent, schemas.updateStatusSchema);
      validationsContent = this.insertListSchema(validationsContent, schemas.listSchema);
      validationsContent = this.insertDetailsSchema(validationsContent, schemas.detailsSchema);
      validationsContent = this.insertUpdateSchema(validationsContent, mainModelName, schemas.updateSchema);

      validationsContent = this.replaceSchemaNames(
        validationsContent,
        toPascalCase(pluralName),
        toPascalCase(singularName)
      );

      return validationsContent;
    } catch (error) {
      throw new Error(`Failed to generate validations: ${error.message}`);
    }
  }

  generateImports(tableData) {
    const referencedModels = new Set();

    for (const [columnName] of Object.entries(tableData.columnDetails)) {
      const foreignKeyInfo = this.foreignKeyReferences.get(columnName);
      if (foreignKeyInfo) {
        referencedModels.add(foreignKeyInfo.modelName);
      }
    }

    const moreModels = Array.from(referencedModels).join(', ');
    return { moreModels: moreModels ? `${moreModels}` : '' };
  }

  generateSchemas(tableData, mainModelName) {
    const createFields = [];
    const updateFields = [];
    const listFilters = [];

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      const camelFieldName = toCamelCase(columnName);
      const isRequired = this.isFieldRequired(columnName, columnDetails, tableData);
      const validationSchema = this.generateFieldValidation(columnName, columnDetails, isRequired, mainModelName);

      // CREATE schema fields
      if (!this.shouldSkipField(columnName)) {
        createFields.push(`  ${camelFieldName}: ${validationSchema.create},`);
      }

      // UPDATE schema fields (todos los campos de creación, pero opcionales)
      if (!this.shouldSkipField(columnName)) {
        const updateValidation = validationSchema.create.replace('required: true', 'required: false');
        updateFields.push(`  ${camelFieldName}: ${updateValidation},`);
      }

      // LIST schema filters (solo foreign keys y enums)
      if (this.shouldIncludeInListFilters(columnName, columnDetails)) {
        listFilters.push(`  ${camelFieldName}: ${validationSchema.list},`);
      }
    }

    return {
      createSchema: createFields.join('\n'),
      updateStatusSchema: this.generateUpdateStatusFields(mainModelName),
      listSchema: listFilters.join('\n'),
      detailsSchema: '', // Solo dejar comentario
      updateSchema: updateFields.join('\n'),
    };
  }

  generateFieldValidation(columnName, columnDetails, isRequired) {
    const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();
    const camelFieldName = toCamelCase(columnName);

    // Foreign key validation
    if (this.foreignKeyReferences.has(columnName)) {
      const foreignKeyInfo = this.foreignKeyReferences.get(columnName);
      return {
        create: `databaseSchemas.idSchema('${camelFieldName}', 'body', { model: ${foreignKeyInfo.modelName}, required: ${isRequired} })`,
        list: `databaseSchemas.idSchema('${camelFieldName}', 'query', { model: ${foreignKeyInfo.modelName}, required: false })`,
        details: `databaseSchemas.idSchema('${camelFieldName}', 'query', { model: ${foreignKeyInfo.modelName}, required: false })`,
      };
    }

    // Enum validation
    if (this.enumColumns.has(columnName)) {
      const enumValues = this.enumColumns.get(columnName);
      const enumArray = enumValues.map((v) => `'${v}'`).join(', ');
      return {
        create: `commonSchemas.inSchema('${camelFieldName}', [${enumArray}], 'body', { required: ${isRequired} })`,
        list: `commonSchemas.inSchema('${camelFieldName}', [${enumArray}], 'query', { required: false })`,
        details: `commonSchemas.inSchema('${camelFieldName}', [${enumArray}], 'query', { required: false })`,
      };
    }

    // Data type based validation
    return this.generateTypeBasedValidation(columnName, columnDetails, columnType, isRequired);
  }

  generateTypeBasedValidation(columnName, columnDetails, columnType, isRequired) {
    const camelFieldName = toCamelCase(columnName);
    const fieldName = (columnDetails.COLUMN_NAME || '').toLowerCase();

    // String types
    if (columnType.includes('varchar') || columnType.includes('char') || columnType.includes('text')) {
      const lengthMatch = columnType.match(/\((\d+)\)/);
      const maxLength = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;

      const options = {
        required: isRequired,
        ...(maxLength && { maxLength }),
      };

      // Special string validations
      if (fieldName.includes('email')) {
        options.pattern = '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/';
      } else if (fieldName.includes('phone') || fieldName.includes('telefono')) {
        options.pattern = '/^[+]?[0-9\\s\\-()]+$/';
        options.minLength = 7;
        options.maxLength = 20;
      } else if (fieldName.includes('url') || fieldName.includes('link')) {
        return {
          create: `commonSchemas.linkSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
          list: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
          details: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
        };
      }

      const optionsStr = this.formatOptions(options);
      return {
        create: `commonSchemas.stringSchema('${camelFieldName}', 'body', ${optionsStr})`,
        list: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

    // Numeric types
    if (this.isNumericType(columnType)) {
      const isBoolean = fieldName.endsWith('_is') || fieldName.startsWith('is_');

      if (isBoolean && columnType.includes('tinyint')) {
        return {
          create: `commonSchemas.booleanSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
          list: `commonSchemas.booleanSchema('${camelFieldName}', 'query', { required: false })`,
          details: `commonSchemas.booleanSchema('${camelFieldName}', 'query', { required: false })`,
        };
      }

      const { minValue, maxValue } = this.getNumericRange(columnType);
      const options = {
        required: isRequired,
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
      };

      const optionsStr = this.formatOptions(options);
      return {
        create: `commonSchemas.numberSchema('${camelFieldName}', 'body', ${optionsStr})`,
        list: `commonSchemas.numberSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.numberSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

    // Date types
    if (columnType.includes('date') || columnType.includes('timestamp')) {
      return {
        create: `commonSchemas.dateSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
        list: `commonSchemas.dateSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.dateSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

    // Boolean types
    if (columnType.includes('boolean') || columnType.includes('bool')) {
      return {
        create: `commonSchemas.booleanSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
        list: `commonSchemas.booleanSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.booleanSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

    // JSON types
    if (columnType.includes('json')) {
      return {
        create: `commonSchemas.objectSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
        list: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

    // Default to string
    return {
      create: `commonSchemas.stringSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
      list: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
      details: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
    };
  }

  isNumericType(columnType) {
    return (
      columnType.includes('int') ||
      columnType.includes('decimal') ||
      columnType.includes('numeric') ||
      columnType.includes('float') ||
      columnType.includes('double') ||
      columnType.includes('real')
    );
  }

  getNumericRange(columnType) {
    const isUnsigned = /unsigned/.test(columnType);

    if (columnType.includes('tinyint')) {
      return { minValue: 0, maxValue: isUnsigned ? 255 : 127 };
    } else if (columnType.includes('smallint')) {
      return { minValue: 0, maxValue: isUnsigned ? 65535 : 32767 };
    } else if (columnType.includes('mediumint')) {
      return { minValue: 0, maxValue: isUnsigned ? 16777215 : 8388607 };
    } else if (columnType.includes('bigint')) {
      return { minValue: 0, maxValue: Number.MAX_SAFE_INTEGER };
    } else if (columnType.includes('int')) {
      return { minValue: 0, maxValue: isUnsigned ? 4294967295 : 2147483647 };
    }

    return {};
  }

  isFieldRequired(columnName, columnDetails) {
    if (this.shouldSkipField(columnName)) return false;
    if (columnDetails.EXTRA && columnDetails.EXTRA.toLowerCase().includes('auto_increment')) return false;
    if (columnDetails.COLUMN_KEY && columnDetails.COLUMN_KEY.toUpperCase() === 'PRI') return false;

    const notNullable = columnDetails.NULLABLE === '0';
    const hasDefault = columnDetails.COLUMN_DEFAULT !== null && columnDetails.COLUMN_DEFAULT !== undefined;

    return notNullable && !hasDefault;
  }

  shouldIncludeInListFilters(columnName, columnDetails) {
    const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();

    // Solo incluir enums y foreign keys
    if (columnType.includes('enum')) return true;
    if (this.foreignKeyReferences.has(columnName)) return true;

    return false;
  }

  generateUpdateStatusFields(mainModelName) {
    return `  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: ${mainModelName}, required: true }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true }),`;
  }

  formatOptions(options) {
    const formatted = Object.entries(options)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: ${value}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join(', ');

    return `{ ${formatted} }`;
  }

  insertCreateSchema(content, createFields) {
    const placeholder = 'const createSchema = {\n  // Add any additional body parameters here\n};';
    const replacement = `const createSchema = {\n${createFields}\n  // Add any additional body parameters here\n};`;
    return content.replace(placeholder, replacement);
  }

  insertUpdateStatusSchema(content, updateStatusFields) {
    const placeholder =
      "const updateStatusSchema = {\n  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: {{MAIN_MODEL}}, required: true }),\n  active: commonSchemas.booleanSchema('active', 'body', { required: true }),\n  // Add any additional body parameters here\n};";
    const replacement = `const updateStatusSchema = {\n  ${updateStatusFields}\n  // Add any additional body parameters here\n};`;
    return content.replace(placeholder, replacement);
  }

  insertListSchema(content, listFields) {
    if (listFields) {
      const placeholder = '  // Add any additional query parameters here';
      const replacement = `${listFields}\n  // Add any additional query parameters here`;
      return content.replace(placeholder, replacement);
    }
    return content;
  }

  insertDetailsSchema(content) {
    // No insertar campos adicionales, solo dejar el comentario
    return content;
  }

  insertUpdateSchema(content, mainModelName, updateFields) {
    const placeholder =
      "const updateSchema = {\n  id: databaseSchemas.idSchema('id', 'params', { model: " +
      mainModelName +
      ', required: true, paranoid: false }),\n  // Add any additional body parameters here\n};';
    const replacement = `const updateSchema = {\n  id: databaseSchemas.idSchema('id', 'params', { model: ${mainModelName}, required: true, paranoid: false }),\n${updateFields}\n  // Add any additional body parameters here\n};`;

    return content.replace(placeholder, replacement);
  }

  async saveValidations(validationsContent, tableName, groupName) {
    try {
      const validationsDir = path.resolve(__dirname, '../schemas/validations', groupName);
      if (!fs.existsSync(validationsDir)) fs.mkdirSync(validationsDir, { recursive: true });

      const namesParts = tableName.split('_');
      const pluralName = namesParts.slice(1).join('_');
      const fileName = `${toCamelCase(pluralName)}.schemas.js`;
      const filePath = path.join(validationsDir, fileName);

      fs.writeFileSync(filePath, validationsContent, 'utf-8');

      console.log(`📄 Validations saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save validations: ${error.message}`);
    }
  }

  replaceSchemaNames(validationsContent, pluralName, singularName) {
    validationsContent = validationsContent
      .replace(/createSchema/g, `create${singularName}Schema`)
      .replace(/updateStatusSchema/g, `update${singularName}StatusSchema`)
      .replace(/listSchema/g, `list${pluralName}Schema`)
      .replace(/detailsSchema/g, `details${singularName}Schema`)
      .replace(/updateSchema/g, `update${singularName}Schema`)
      .replace(/deleteSchema/g, `delete${singularName}Schema`);

    return validationsContent;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

if (require.main === module) {
  const generator = new CrudValidationsGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudValidationsGenerator;
