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
const { PATHS, PREFIXES } = require('../helpers/constants.helper');
const { cerror } = require('../helpers/debug.helper');
const { toCamelCase } = require('../helpers/strings.helper');

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

      const serviceContent = await this.generateService(tableData, singularName, pluralName);
      await this.saveService(serviceContent, tableName, groupName);

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
            const modelName = this.getModelNameFromTable(referencedTable);
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

  async generateService(tableData, singularName, pluralName) {
    try {
      const templatePath = path.resolve(__dirname, '../templates/services/services.template.js');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      let serviceContent = fs.readFileSync(templatePath, 'utf-8');

      // Get model names and method names
      const mainModelName = this.getModelNameFromTable(tableData.tableName);
      const serviceName = `${this.capitalize(singleName)}Services`;
      const singleName = toCamelCase(singularName);

      // Generate method names
      const methodNames = this.generateMethodNames(singularName, pluralName);

      // Generate field lists
      const fields = this.generateFieldLists(tableData);

      // Generate includes for relationships
      const includes = this.generateIncludes();

      // Generate filters for list method
      const filters = this.generateFilters(tableData);

      // Replace template placeholders
      serviceContent = this.replaceTemplatePlaceholders(serviceContent, {
        mainModel: mainModelName,
        serviceName: serviceName,
        singleName: singleName,
        methodNames: methodNames,
        fields: fields,
        includes: includes,
        filters: filters,
      });

      return serviceContent;
    } catch (error) {
      throw new Error(`Failed to generate service: ${error.message}`);
    }
  }

  generateMethodNames(singularName, pluralName) {
    const capitalizedSingular = this.capitalize(singularName);
    const capitalizedPlural = this.capitalize(pluralName);

    return {
      create: `create${capitalizedSingular}`,
      updateStatus: `update${capitalizedPlural}Status`,
      list: `getList${capitalizedPlural}`,
      details: `get${capitalizedSingular}Details`,
      update: `update${capitalizedSingular}`,
      delete: `delete${capitalizedSingular}`,
    };
  }

  generateFieldLists(tableData) {
    const allFieldsArray = [];
    const requiredFieldsArray = [];
    const optionalFieldsArray = [];

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      if (this.shouldSkipField(columnName)) continue;

      const camelFieldName = toCamelCase(columnName);
      allFieldsArray.push(camelFieldName);

      const isRequired = this.isFieldRequired(columnName, columnDetails);
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

  shouldIncludeInFilters(columnName, columnDetails) {
    const columnType = (columnDetails.COLUMN_TYPE || '').toLowerCase();

    // Only include enums and foreign keys
    if (columnType.includes('enum')) return true;
    if (this.foreignKeyReferences.has(columnName)) return true;

    return false;
  }

  isFieldRequired(columnName, columnDetails) {
    if (this.shouldSkipField(columnName)) return false;
    if (columnDetails.EXTRA && columnDetails.EXTRA.toLowerCase().includes('auto_increment')) return false;
    if (columnDetails.COLUMN_KEY && columnDetails.COLUMN_KEY.toUpperCase() === 'PRI') return false;

    const notNullable = columnDetails.NULLABLE === '0';
    const hasDefault = columnDetails.COLUMN_DEFAULT !== null && columnDetails.COLUMN_DEFAULT !== undefined;

    return notNullable && !hasDefault;
  }

  replaceTemplatePlaceholders(template, replacements) {
    const { mainModel, serviceName, singleName, methodNames, fields, includes, filters } = replacements;

    template = template.replace(/\{\{MAIN_MODEL\}\}/g, mainModel);
    template = template.replace(/\{\{SERVICE_NAME\}\}/g, serviceName);
    template = template.replace(/\{\{SINGLE_NAME\}\}/g, singleName);

    // Method names
    template = template.replace(/\{\{CREATE_METHOD\}\}/g, methodNames.create);
    template = template.replace(/\{\{UPDATE_STATUS_METHOD\}\}/g, methodNames.updateStatus);
    template = template.replace(/\{\{LIST_METHOD\}\}/g, methodNames.list);
    template = template.replace(/\{\{DETAILS_METHOD\}\}/g, methodNames.details);
    template = template.replace(/\{\{UPDATE_METHOD\}\}/g, methodNames.update);
    template = template.replace(/\{\{DELETE_METHOD\}\}/g, methodNames.delete);

    // Field lists
    template = template.replace(/\{\{REQUIRED_FIELDS\}\}/g, fields.requiredFields);
    template = template.replace(/\{\{OPTIONAL_FIELDS\}\}/g, fields.optionalFields);
    template = template.replace(/\{\{ALL_DATA\}\}/g, fields.allData);

    // Includes and filters
    template = template.replace(/\{\{INCLUDES\}\}/g, includes);
    template = template.replace(/\{\{FILTERS\}\}/g, filters);

    return template;
  }

  async saveService(serviceContent, tableName, groupName) {
    try {
      const servicesDir = path.resolve(PATHS.SERVICES, groupName);
      if (!fs.existsSync(servicesDir)) fs.mkdirSync(servicesDir, { recursive: true });

      const namesParts = tableName.split('_');
      const pluralName = namesParts.slice(1).join('_');
      const fileName = `${toCamelCase(pluralName)}.services.js`;
      const filePath = path.join(servicesDir, fileName);

      fs.writeFileSync(filePath, serviceContent, 'utf-8');

      console.log(`📄 Service saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save service: ${error.message}`);
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

if (require.main === module) {
  const generator = new CrudServicesGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudServicesGenerator;
