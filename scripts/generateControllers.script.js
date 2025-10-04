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
const { toCamelCase, formatCapitalize } = require('../helpers/strings.helper');

// =============================================================================
// SCRIPT CONFIGURATION
// =============================================================================
const SCRIPT_NAME = 'Generate CRUD Controllers';
const REQUIRED_ARGS = 2;

class CrudControllersGenerator {
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

      const controllerContent = await this.generateController(tableData, singularName, pluralName);
      await this.saveController(controllerContent, groupName, pluralName);

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
      console.error(`📋 Usage: npx generate-crud-controllers <table_name> <singular_name>`);
      console.error(`📝 Example: npx generate-crud-controllers usr_users user`);
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

  async generateController(tableData, singularName, pluralName) {
    try {
      let controllerContent = await this.crudHelper.getTemplate('controllers', 'controllers');

      const controllerName = `${formatCapitalize(singularName)}Controllers`;
      const serviceName = `${formatCapitalize(singularName)}Services`;
      const serviceVariable = `${toCamelCase(singularName)}Services`;

      const methodNames = this.crudHelper.generateMethodNames(singularName, pluralName);
      const fields = this.generateFieldLists(tableData);

      controllerContent = this.replaceTemplatePlaceholders(controllerContent, {
        controllerName,
        serviceName,
        serviceVariable,
        singularName,
        pluralName,
        methodNames,
        fields,
      });

      return controllerContent;
    } catch (error) {
      throw new Error(`Failed to generate controller: ${error.message}`);
    }
  }

  generateFieldLists(tableData) {
    const allFieldsArray = [];
    const requiredFieldsArray = [];
    const optionalFieldsArray = [];

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      if (this.crudHelper.shouldSkipField(columnName)) continue;

      const camelFieldName = toCamelCase(columnName);
      allFieldsArray.push(camelFieldName);

      const isRequired = this.crudHelper.isFieldRequired(columnName, columnDetails);
      if (isRequired) {
        requiredFieldsArray.push(camelFieldName);
      } else {
        optionalFieldsArray.push(camelFieldName);
      }
    }

    return {
      allFields: allFieldsArray.join(', '),
      requiredFields: requiredFieldsArray.join(', '),
      optionalFields: optionalFieldsArray.join(', '),
    };
  }

  replaceTemplatePlaceholders(template, replacements) {
    const { controllerName, serviceName, serviceVariable, singularName, pluralName, methodNames, fields } =
      replacements;

    template = template.replace(/\{\{CONTROLLER_NAME\}\}/g, controllerName);
    template = template.replace(/\{\{SERVICE_NAME\}\}/g, serviceName);
    template = template.replace(/\{\{SERVICE_VARIABLE\}\}/g, serviceVariable);
    template = template.replace(/\{\{SINGULAR_NAME\}\}/g, singularName);
    template = template.replace(/\{\{PLURAL_NAME\}\}/g, pluralName);

    template = template.replace(/\{\{CREATE_METHOD\}\}/g, methodNames.create);
    template = template.replace(/\{\{UPDATE_STATUS_METHOD\}\}/g, methodNames.updateStatus);
    template = template.replace(/\{\{LIST_METHOD\}\}/g, methodNames.list);
    template = template.replace(/\{\{DETAILS_METHOD\}\}/g, methodNames.details);
    template = template.replace(/\{\{UPDATE_METHOD\}\}/g, methodNames.update);
    template = template.replace(/\{\{DELETE_METHOD\}\}/g, methodNames.delete);

    template = template.replace(/\{\{ALL_FIELDS\}\}/g, fields.allFields);
    template = template.replace(/\{\{REQUIRED_FIELDS\}\}/g, fields.requiredFields);
    template = template.replace(/\{\{OPTIONAL_FIELDS\}\}/g, fields.optionalFields);

    return template;
  }

  async saveController(controllerContent, groupName, pluralName) {
    try {
      const fileName = `${toCamelCase(pluralName)}.controllers`;
      const folderPath = await this.crudHelper.createFolder('CONTROLLERS', groupName, '');
      const filePath = await this.crudHelper.createFile(folderPath, fileName, controllerContent);

      console.log(`📄 Controller saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save controller: ${error.message}`);
    }
  }
}

if (require.main === module) {
  const generator = new CrudControllersGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudControllersGenerator;
