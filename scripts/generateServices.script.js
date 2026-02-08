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
const { toCamelCase, formatCapitalize } = require('../utils/strings.util');

// =============================================================================
// SCRIPT CONFIGURATION
// =============================================================================
const SCRIPT_NAME = 'Generate CRUD Services';
const REQUIRED_ARGS = 2;

class CrudServicesGenerator {
  constructor() {
    this.crudHelper = new CrudHelper();
    this.startTime = performance.now();
    this.foreignKeyReferences = new Map();
    this.enumColumns = new Map();
    this.booleanColumns = new Set();
  }

  async run() {
    try {
      console.log(`\n🚀 Starting ${SCRIPT_NAME}...`);

      await this.crudHelper.initialize();

      const { tableName, singularName } = this.validateArguments();
      const { groupName, pluralName } = this.crudHelper.extractPrefixInfo(tableName);
      const tableData = await this.analyzeTable(tableName);

      await this.analyzeForeignKeys(tableData);
      await this.analyzeEnums(tableData);
      await this.analyzeBooleans(tableData);

      const serviceContent = await this.generateService(tableData, singularName, pluralName);
      await this.saveService(serviceContent, groupName, pluralName);

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
      console.error(`📋 Usage: npx generate-services <table_name> <singular_name>`);
      console.error(`📝 Example: npx generate-services usr_users user`);
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

  async analyzeBooleans(tableData) {
    console.log(`🔲 Analyzing booleans for table: ${tableData.tableName}`);

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();

      // Check if it's a tinyint(1) and if it should be treated as boolean
      if (columnType.includes('tinyint(1)') && !this.crudHelper.shouldBeTinyInt(columnName, columnType)) {
        this.booleanColumns.add(columnName);
        console.log(`🔲 Boolean detected: ${columnName}`);
      }
    }
  }

  async generateService(tableData, singularName, pluralName) {
    try {
      let serviceContent = await this.crudHelper.getTemplate('crud', 'services');

      const mainModelName = toCamelCase(tableData.tableName);
      const serviceName = `${formatCapitalize(singularName)}Services`;
      const singleName = toCamelCase(singularName);

      const methodNames = this.crudHelper.generateMethodNames(singularName, pluralName);
      const fields = this.generateFieldLists(tableData);
      const includes = this.generateIncludes();
      const filters = this.generateFilters(tableData);
      const filterConditions = this.generateFilterConditions(tableData);

      serviceContent = this.replaceTemplatePlaceholders(serviceContent, {
        mainModel: mainModelName,
        serviceName: serviceName,
        singleName: singleName,
        methodNames: methodNames,
        fields: fields,
        includes: includes,
        filters: filters,
        filterConditions: filterConditions,
      });

      return serviceContent;
    } catch (error) {
      throw new Error(`Failed to generate service: ${error.message}`);
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
      allData: allFieldsArray.join(', '),
    };
  }

  generateIncludes() {
    const includes = Array.from(this.foreignKeyReferences.values())
      .map((fk) => `// { model: ${fk.modelName}, as: '${fk.modelName.toLowerCase()}' }`)
      .join('\n    ');

    return includes || '// Add your model includes here';
  }

  generateFilters(tableData) {
    const filterFields = [];

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      if (this.shouldIncludeInFilters(columnName, columnDetails)) {
        filterFields.push(toCamelCase(columnName));
      }
    }

    return filterFields.join(', ');
  }

  generateFilterConditions(tableData) {
    const filterConditions = [];

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      if (this.shouldIncludeInFilters(columnName, columnDetails)) {
        const camelFieldName = toCamelCase(columnName);
        filterConditions.push(
          `if (${camelFieldName} !== undefined) optionsQuery.where.${camelFieldName} = ${camelFieldName};`
        );
      }
    }

    return filterConditions.join('\n    ');
  }

  /**
   * Determines whether a column should appear as a filterable field
   * in the LIST and DETAILS methods. Mirrors the same criteria used
   * by the docs generator's isFilterableField method.
   */
  shouldIncludeInFilters(columnName, columnDetails) {
    if (this.crudHelper.shouldSkipField(columnName)) return false;

    const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();

    // Enum columns are filterable
    if (columnType.includes('enum')) return true;

    // Foreign key columns are filterable
    if (this.foreignKeyReferences.has(columnName)) return true;

    // Boolean columns (tinyint(1) that should not remain as tinyint) are filterable
    if (this.booleanColumns.has(columnName)) return true;

    return false;
  }

  replaceTemplatePlaceholders(template, replacements) {
    const { mainModel, serviceName, singleName, methodNames, fields, includes, filters, filterConditions } =
      replacements;

    template = template.replace(/\{\{MAIN_MODEL\}\}/g, mainModel);
    template = template.replace(/\{\{SERVICE_NAME\}\}/g, serviceName);
    template = template.replace(/\{\{SINGLE_NAME\}\}/g, singleName);

    template = template.replace(/\{\{CREATE_METHOD\}\}/g, methodNames.create);
    template = template.replace(/\{\{UPDATE_STATUS_METHOD\}\}/g, methodNames.updateStatus);
    template = template.replace(/\{\{LIST_METHOD\}\}/g, methodNames.list);
    template = template.replace(/\{\{DETAILS_METHOD\}\}/g, methodNames.details);
    template = template.replace(/\{\{UPDATE_METHOD\}\}/g, methodNames.update);
    template = template.replace(/\{\{DELETE_METHOD\}\}/g, methodNames.delete);

    template = template.replace(/\{\{REQUIRED_FIELDS\}\}/g, fields.requiredFields);
    template = template.replace(/\{\{OPTIONAL_FIELDS\}\}/g, fields.optionalFields);
    template = template.replace(/\{\{ALL_DATA\}\}/g, fields.allData);

    template = template.replace(/\{\{INCLUDES\}\}/g, includes);
    template = template.replace(/\{\{FILTERS\}\}/g, filters);

    template = template.replace(/\/\/ Set FILTERS here/g, filterConditions);

    return template;
  }

  async saveService(serviceContent, groupName, pluralName) {
    try {
      const fileName = `${toCamelCase(pluralName)}.services`;
      const folderPath = await this.crudHelper.createFolder('SERVICES', '/' + groupName, '');
      const filePath = await this.crudHelper.createFile(folderPath, fileName, serviceContent);

      console.log(`📄 Service saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save service: ${error.message}`);
    }
  }
}

if (require.main === module) {
  const generator = new CrudServicesGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudServicesGenerator;
