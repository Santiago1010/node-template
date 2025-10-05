#!/usr/bin/env node
'use strict';

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const { performance } = require('perf_hooks');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CrudHelper = require('../helpers/crud.helper');
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
      const { groupName, pluralName } = this.crudHelper.extractPrefixInfo(tableName);
      const tableData = await this.analyzeTable(tableName);

      await this.analyzeForeignKeys(tableData);
      await this.analyzeEnums(tableData);

      const validationsContent = await this.generateValidations(tableData, singularName, pluralName);
      await this.saveValidations(validationsContent, groupName, pluralName);

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

  async analyzeTable(tableName) {
    try {
      console.log(`🔍 Analyzing table: ${tableName}`);

      const allColumns = await this.crudHelper.readAllColumns(tableName);
      const requiredColumns = await this.crudHelper.readRequiredColumns(tableName);
      const nullableColumns = await this.crudHelper.readNullableOrDefaultColumns(tableName);
      const enumColumns = await this.crudHelper.searchEnums(tableName);

      const columnDetails = {};
      for (const columnName of allColumns.columns) {
        if (this.crudHelper.shouldSkipField(columnName)) continue;
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

  async analyzeForeignKeys(tableData) {
    console.log(`🔗 Analyzing foreign keys for table: ${tableData.tableName}`);

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      if (this.crudHelper.isForeignKey(columnName, columnDetails)) {
        try {
          const referencedTable = await this.crudHelper.getReferencedTable(tableData.tableName, columnName);
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

  async generateValidations(tableData, singularName, pluralName) {
    try {
      let validationsContent = await this.crudHelper.getTemplate('crud', 'validations');
      const mainModelName = toCamelCase(tableData.tableName);
      const imports = this.generateImports(tableData);
      const schemas = this.generateSchemas(tableData, mainModelName);

      validationsContent = validationsContent.replace(/\{\{MAIN_MODEL\}\}/g, mainModelName);
      validationsContent = validationsContent.replace(/\{\{MORE_MODELS\}\}/g, imports.moreModels);

      validationsContent = this.insertCreateSchema(validationsContent, schemas.createSchema);
      validationsContent = this.insertUpdateStatusSchema(validationsContent, schemas.updateStatusSchema);
      validationsContent = this.insertListSchema(validationsContent, schemas.listSchema);
      validationsContent = this.insertDetailsSchema(validationsContent);
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
      const isRequired = this.crudHelper.isFieldRequired(columnName, columnDetails);
      const validationSchema = this.generateFieldValidation(columnName, columnDetails, isRequired);

      if (!this.crudHelper.shouldSkipField(columnName)) {
        createFields.push(`  ${camelFieldName}: ${validationSchema.create},`);
      }

      if (!this.crudHelper.shouldSkipField(columnName)) {
        const updateValidation = validationSchema.create.replace('required: true', 'required: false');
        updateFields.push(`  ${camelFieldName}: ${updateValidation},`);
      }

      if (this.shouldIncludeInListFilters(columnName, columnDetails)) {
        listFilters.push(`  ${camelFieldName}: ${validationSchema.list},`);
      }
    }

    return {
      createSchema: createFields.join('\n'),
      updateStatusSchema: this.generateUpdateStatusFields(mainModelName),
      listSchema: listFilters.join('\n'),
      detailsSchema: '',
      updateSchema: updateFields.join('\n'),
    };
  }

  generateFieldValidation(columnName, columnDetails, isRequired) {
    const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();
    const camelFieldName = toCamelCase(columnName);

    if (this.foreignKeyReferences.has(columnName)) {
      const foreignKeyInfo = this.foreignKeyReferences.get(columnName);
      return {
        create: `databaseSchemas.idSchema('${camelFieldName}', 'body', { model: ${foreignKeyInfo.modelName}, required: ${isRequired} })`,
        list: `databaseSchemas.idSchema('${camelFieldName}', 'query', { model: ${foreignKeyInfo.modelName}, required: false })`,
        details: `databaseSchemas.idSchema('${camelFieldName}', 'query', { model: ${foreignKeyInfo.modelName}, required: false })`,
      };
    }

    if (this.enumColumns.has(columnName)) {
      const enumValues = this.enumColumns.get(columnName);
      const enumArray = enumValues.map((v) => `'${v}'`).join(', ');
      return {
        create: `commonSchemas.inSchema('${camelFieldName}', [${enumArray}], 'body', { required: ${isRequired} })`,
        list: `commonSchemas.inSchema('${camelFieldName}', [${enumArray}], 'query', { required: false })`,
        details: `commonSchemas.inSchema('${camelFieldName}', [${enumArray}], 'query', { required: false })`,
      };
    }

    return this.generateTypeBasedValidation(columnName, columnDetails, columnType, isRequired);
  }

  generateTypeBasedValidation(columnName, columnDetails, columnType, isRequired) {
    const camelFieldName = toCamelCase(columnName);
    const fieldName = (columnDetails.COLUMN_NAME || '').toLowerCase();

    if (columnType.includes('varchar') || columnType.includes('char') || columnType.includes('text')) {
      const lengthMatch = columnType.match(/\((\d+)\)/);
      const maxLength = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;

      const options = {
        required: isRequired,
        ...(maxLength && { maxLength }),
      };

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

    if (columnType.includes('date') || columnType.includes('timestamp')) {
      return {
        create: `commonSchemas.dateSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
        list: `commonSchemas.dateSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.dateSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

    if (columnType.includes('boolean') || columnType.includes('bool')) {
      return {
        create: `commonSchemas.booleanSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
        list: `commonSchemas.booleanSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.booleanSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

    if (columnType.includes('json')) {
      return {
        create: `commonSchemas.objectSchema('${camelFieldName}', 'body', { required: ${isRequired} })`,
        list: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
        details: `commonSchemas.stringSchema('${camelFieldName}', 'query', { required: false })`,
      };
    }

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

  shouldIncludeInListFilters(columnName, columnDetails) {
    const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();

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

  async saveValidations(validationsContent, groupName, pluralName) {
    try {
      const fileName = `${toCamelCase(pluralName)}.validations`;
      const folderPath = await this.crudHelper.createFolder('ROUTES_DEFAULT', groupName + '/validations', '');
      const filePath = await this.crudHelper.createFile(folderPath, fileName, validationsContent);

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
}

if (require.main === module) {
  const generator = new CrudValidationsGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudValidationsGenerator;
