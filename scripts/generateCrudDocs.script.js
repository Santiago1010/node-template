#!/usr/bin/env node
'use strict';

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs'); // File system operations
const path = require('path'); // Path manipulation utilities
const { performance } = require('perf_hooks'); // High-resolution timing for performance metrics

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CrudHelper = require('../helpers/crud.helper'); // Base class for CRUD operations and template management
const { PREFIXES } = require('../helpers/constants.helper'); // Table prefix to group name mappings
const { cerror } = require('../helpers/debug.helper'); // Enhanced logging and error handling utilities

// =============================================================================
// SCRIPT CONFIGURATION
// =============================================================================
const SCRIPT_NAME = 'Generate CRUD Docs';
const REQUIRED_ARGS = 2;

// Faker mapping for different data types based on MySQL column types
const FAKER_MAPPINGS = {
  // String types with length consideration
  varchar: (length) => {
    if (length <= 10) return 'faker.string.alphanumeric(10).toUpperCase()';
    if (length <= 50) return 'faker.company.name()';
    if (length <= 100) return 'faker.lorem.words(3)';
    return 'faker.lorem.sentence()';
  },
  char: (length) => `faker.string.alphanumeric(${Math.min(length || 10, 10)}).toUpperCase()`,
  text: () => 'faker.lorem.paragraph()',
  longtext: () => 'faker.lorem.paragraphs(2)',
  mediumtext: () => 'faker.lorem.paragraph()',

  // Numeric types
  int: () => 'faker.number.int({ min: 1, max: 100 })',
  integer: () => 'faker.number.int({ min: 1, max: 100 })',
  bigint: () => 'faker.number.int({ min: 1, max: 1000 })',
  float: () => 'faker.number.float({ min: 0.1, max: 100.0, precision: 0.01 })',
  decimal: () => 'faker.number.float({ min: 0.1, max: 1000.0, precision: 0.01 })',
  double: () => 'faker.number.float({ min: 0.1, max: 1000.0, precision: 0.01 })',
  real: () => 'faker.number.float({ min: 0.1, max: 100.0, precision: 0.01 })',

  // Tiny integer (often used for small ranges)
  tinyint: () => 'faker.number.int({ min: 1, max: 127 })',

  // Boolean
  boolean: () => 'faker.datatype.boolean()',
  bool: () => 'faker.datatype.boolean()',

  // Date types
  datetime: () => "moment(faker.date.future()).format('YYYY-MM-DD HH:mm:ss')",
  timestamp: () => "moment(faker.date.future()).format('YYYY-MM-DD HH:mm:ss')",
  date: () => "moment(faker.date.future()).format('YYYY-MM-DD')",
  time: () => "moment(faker.date.recent()).format('HH:mm:ss')",
  year: () => 'faker.date.recent().getFullYear()',

  // JSON
  json: () => 'faker.helpers.objectValue({ key1: "value1", key2: "value2" })',

  // Binary
  blob: () => '"base64encodeddata"',
  longblob: () => '"base64encodeddata"',
  mediumblob: () => '"base64encodeddata"',

  // Default fallback
  default: () => 'faker.lorem.word()',
};

/**
 * Main script execution class
 */
class CrudDocsGenerator {
  constructor() {
    this.crudHelper = new CrudHelper();
    this.startTime = performance.now();
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log(`\n🚀 Starting ${SCRIPT_NAME}...`);

      // Validate command line arguments
      const { tableName, singularName } = this.validateArguments();

      // Extract prefix and determine group/tag names
      const { groupName, tagName } = this.extractPrefixInfo(tableName);

      // Analyze the table using CrudHelper
      const tableData = await this.analyzeTable(tableName);

      // Generate documentation
      const documentation = await this.generateDocumentation(tableData, singularName, tagName);

      // Save documentation file
      await this.saveDocumentation(documentation, tableName, groupName);

      // Performance metrics
      const endTime = performance.now();
      const executionTime = ((endTime - this.startTime) / 1000).toFixed(2);

      console.log(`\n✅ ${SCRIPT_NAME} completed successfully!`);
      console.log(`⏱️  Execution time: ${executionTime} seconds`);
    } catch (error) {
      cerror(`❌ ${SCRIPT_NAME} failed:`, error);
      process.exit(1);
    }
  }

  /**
   * Validate command line arguments
   */
  validateArguments() {
    const args = process.argv.slice(2);

    if (args.length !== REQUIRED_ARGS) {
      console.error(`\n❌ Error: Invalid number of arguments.`);
      console.error(`📋 Usage: npx generate-crud-docs <table_name> <singular_name>`);
      console.error(`📝 Example: npx generate-crud-docs usr_users user`);
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

  /**
   * Extract prefix information and determine group/tag names
   */
  extractPrefixInfo(tableName) {
    // Extract prefix from table name (e.g., 'usr_users' -> 'usr')
    const parts = tableName.split('_');
    const prefix = parts[0].toUpperCase();

    // Get group name from PREFIXES constant
    const groupName = PREFIXES[prefix] || 'general';

    // Generate tag name (capitalize group name)
    const tagName = this.capitalize(groupName);

    console.log(`📂 Prefix: ${prefix}`);
    console.log(`📁 Group: ${groupName}`);
    console.log(`🏷️  Tag: ${tagName}`);

    return { prefix, groupName, tagName };
  }

  /**
   * Analyze table using CrudHelper database queries
   */
  async analyzeTable(tableName) {
    try {
      console.log(`🔍 Analyzing table: ${tableName}`);

      // Get table comment
      const tableComment = await this.crudHelper.readTablesComment(tableName);

      // Get all columns for analysis
      const allColumns = await this.crudHelper.readAllColumns(tableName);
      const requiredColumns = await this.crudHelper.readRequiredColumns(tableName);
      const nullableColumns = await this.crudHelper.readNullableOrDefaultColumns(tableName);
      const enumColumns = await this.crudHelper.searchEnums(tableName);

      // Analyze each column for detailed information
      const columnDetails = {};
      for (const columnName of allColumns.columns) {
        if (this.shouldSkipField(columnName)) continue;

        const details = await this.crudHelper.detailsColumn(tableName, columnName);
        if (details) {
          columnDetails[columnName] = details;
        }
      }

      console.log(`📋 Analyzed ${Object.keys(columnDetails).length} columns`);

      return {
        tableName,
        tableComment,
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

  /**
   * Check if field should be skipped (timestamps, id, etc.)
   */
  shouldSkipField(fieldName) {
    const skipFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt'];
    return skipFields.includes(fieldName);
  }

  /**
   * Generate complete Swagger documentation
   */
  async generateDocumentation(tableData, singularName, tagName) {
    try {
      // Load template
      const template = await this.crudHelper.getTemplate('docs', 'crud');

      // Generate method names
      const methodNames = this.generateMethodNames(singularName);

      // Replace template placeholders
      let documentation = template;

      // Replace method names and tags
      documentation = this.replaceTemplatePlaceholders(documentation, methodNames, tagName);

      // Generate and insert property schemas
      documentation = this.insertPropertySchemas(documentation, tableData, singularName);

      // Add moment import for date handling
      documentation = this.addMomentImport(documentation);

      return documentation;
    } catch (error) {
      throw new Error(`Failed to generate documentation: ${error.message}`);
    }
  }

  /**
   * Generate method names based on table and singular names
   */
  generateMethodNames(singularName) {
    const capitalizedSingular = this.capitalize(singularName);
    const capitalizedPlural = this.capitalize(this.pluralize(singularName));

    return {
      create: `create${capitalizedSingular}`,
      status: `update${capitalizedPlural}Status`,
      list: `getList${capitalizedPlural}`,
      details: `get${capitalizedSingular}Details`,
      update: `update${capitalizedSingular}`,
      delete: `delete${capitalizedSingular}`,
    };
  }

  /**
   * Replace template placeholders
   */
  replaceTemplatePlaceholders(template, methodNames, tagName) {
    // Replace method names
    template = template.replace(/\{\{CRATE_NAME\}\}/g, methodNames.create);
    template = template.replace(/\{\{STATUS_NAME\}\}/g, methodNames.status);
    template = template.replace(/\{\{LIST_NAME\}\}/g, methodNames.list);
    template = template.replace(/\{\{DETAILS_NAME\}\}/g, methodNames.details);
    template = template.replace(/\{\{DELETE_NAME\}\}/g, methodNames.delete);

    // Replace tag names
    template = template.replace(/\{\{TAG\}\}/g, `'${tagName}'`);

    // Replace updateTest with proper method name
    template = template.replace(/updateTest/g, methodNames.update);

    return template;
  }

  /**
   * Insert property schemas into the documentation
   */
  insertPropertySchemas(documentation, tableData, singularName) {
    const { columnDetails, requiredColumns, nullableColumns } = tableData;

    // Generate properties for CREATE operation (required fields)
    const createProperties = this.generatePropertiesObject(columnDetails, requiredColumns, true);
    const createRequired = JSON.stringify(requiredColumns.filter((col) => !this.shouldSkipField(col)));

    // Generate properties for UPDATE operation (all fields optional)
    const updateFields = [...requiredColumns, ...nullableColumns].filter((col) => !this.shouldSkipField(col));
    const updateProperties = this.generatePropertiesObject(columnDetails, updateFields, false);

    // Generate properties for LIST operation parameters (selected filterable fields)
    const listParameters = this.generateListParameters(columnDetails);

    // Replace CREATE properties and required fields
    const createPattern = /required: \[\],\s*properties: \{\}/;
    if (createPattern.test(documentation)) {
      documentation = documentation.replace(
        createPattern,
        `required: ${createRequired},\n            properties: {\n${createProperties}\n            }`
      );
    }

    // Replace UPDATE properties (find the second occurrence)
    const updatePattern = /properties: \{\}/;
    const matches = [...documentation.matchAll(new RegExp(updatePattern.source, 'g'))];
    if (matches.length >= 2) {
      const secondMatch = matches[1];
      const beforeMatch = documentation.substring(0, secondMatch.index);
      const afterMatch = documentation.substring(secondMatch.index + secondMatch[0].length);
      documentation = beforeMatch + `properties: {\n${updateProperties}\n            }` + afterMatch;
    }

    // Insert list parameters
    if (listParameters) {
      documentation = documentation.replace(
        /parameters: \[\.\.\.commonListParams, \.\.\.activeParams\]/,
        `parameters: [\n    ...commonListParams,\n    ...activeParams,${listParameters}\n  ]`
      );
    }

    // Fix array property for status update
    const pluralName = this.pluralize(singularName);
    const arrayProperty = `id${this.capitalize(pluralName)}`;
    documentation = documentation.replace(/idTests/g, arrayProperty);

    return documentation;
  }

  /**
   * Generate properties object string from column details
   */
  generatePropertiesObject(columnDetails, fields, isRequired) {
    const lines = [];

    for (const fieldName of fields) {
      if (!columnDetails[fieldName] || this.shouldSkipField(fieldName)) continue;

      const column = columnDetails[fieldName];
      const property = this.analyzeColumnForProperty(column);
      const requiredText = isRequired ? '**[Required]** ' : '**[Optional]** ';

      lines.push(`              ${fieldName}: {`);
      lines.push(`                type: '${property.type}',`);
      lines.push(`                description: '${requiredText}${column.COLUMN_COMMENT || ''}',`);

      // Add constraints
      if (property.maxLength) {
        lines.push(`                maxLength: ${property.maxLength},`);
      }
      if (property.minimum !== undefined) {
        lines.push(`                minimum: ${property.minimum},`);
      }
      if (property.maximum !== undefined) {
        lines.push(`                maximum: ${property.maximum},`);
      }
      if (property.enum) {
        lines.push(`                enum: [${property.enum.map((v) => `'${v}'`).join(', ')}],`);
      }
      if (property.format) {
        lines.push(`                format: '${property.format}',`);
      }

      lines.push(`                example: ${property.example},`);
      lines.push(`              },`);
    }

    return lines.join('\n');
  }

  /**
   * Analyze column details and convert to OpenAPI property
   */
  analyzeColumnForProperty(column) {
    const columnType = column.COLUMN_TYPE.toLowerCase();
    const property = {};

    // Determine OpenAPI type
    if (columnType.includes('varchar') || columnType.includes('char') || columnType.includes('text')) {
      property.type = 'string';

      // Extract length for varchar/char
      const lengthMatch = columnType.match(/\((\d+)\)/);
      if (lengthMatch) {
        property.maxLength = parseInt(lengthMatch[1]);
      }

      // Generate example based on type
      if (columnType.includes('varchar')) {
        const length = property.maxLength || 255;
        property.example = FAKER_MAPPINGS.varchar(length);
      } else if (columnType.includes('char')) {
        const length = property.maxLength || 10;
        property.example = FAKER_MAPPINGS.char(length);
      } else {
        property.example = FAKER_MAPPINGS.text();
      }
    } else if (columnType.includes('int')) {
      property.type = 'integer';

      if (columnType.includes('tinyint')) {
        property.minimum = 1;
        property.maximum = 127;
        property.example = FAKER_MAPPINGS.tinyint();
      } else if (columnType.includes('bigint')) {
        property.example = FAKER_MAPPINGS.bigint();
      } else {
        property.example = FAKER_MAPPINGS.int();
      }
    } else if (columnType.includes('decimal') || columnType.includes('float') || columnType.includes('double')) {
      property.type = 'number';
      property.example = FAKER_MAPPINGS.decimal();
    } else if (columnType.includes('boolean') || columnType.includes('bool')) {
      property.type = 'boolean';
      property.example = FAKER_MAPPINGS.boolean();
    } else if (columnType.includes('date') && !columnType.includes('datetime')) {
      property.type = 'string';
      property.format = 'date';
      property.example = FAKER_MAPPINGS.date();
    } else if (columnType.includes('datetime') || columnType.includes('timestamp')) {
      property.type = 'string';
      property.format = 'date-time';
      property.example = FAKER_MAPPINGS.datetime();
    } else if (columnType.includes('enum')) {
      property.type = 'string';
      // Extract enum values
      const enumMatch = columnType.match(/enum\((.+)\)/);
      if (enumMatch) {
        const enumValues = enumMatch[1].split(',').map((v) => v.trim().replace(/['"]/g, ''));
        property.enum = enumValues;
        property.example = `faker.helpers.arrayElement([${enumValues.map((v) => `'${v}'`).join(', ')}])`;
      } else {
        property.example = FAKER_MAPPINGS.default();
      }
    } else {
      // Default fallback
      property.type = 'string';
      property.example = FAKER_MAPPINGS.default();
    }

    return property;
  }

  /**
   * Generate list parameters for filtering
   */
  generateListParameters(columnDetails) {
    const parameters = [];

    // Select common filterable fields
    const filterableFields = Object.keys(columnDetails).filter((fieldName) => {
      if (this.shouldSkipField(fieldName)) return false;

      const column = columnDetails[fieldName];
      const columnType = column.COLUMN_TYPE.toLowerCase();

      // Include string fields (for search), enums, booleans, and date fields
      return (
        columnType.includes('varchar') ||
        columnType.includes('char') ||
        columnType.includes('enum') ||
        columnType.includes('boolean') ||
        columnType.includes('date')
      );
    });

    for (const fieldName of filterableFields) {
      const column = columnDetails[fieldName];
      const property = this.analyzeColumnForProperty(column);

      if (property.format === 'date') {
        // Add date range parameters
        parameters.push(`
    {
      name: '${fieldName}From',
      in: 'query',
      description: '**[Optional]** ',
      required: false,
      schema: {
        type: 'string',
        format: 'date',
        example: moment(faker.date.past()).format('YYYY-MM-DD'),
      },
    },
    {
      name: '${fieldName}To',
      in: 'query',
      description: '**[Optional]** ',
      required: false,
      schema: {
        type: 'string',
        format: 'date',
        example: moment(faker.date.future()).format('YYYY-MM-DD'),
      },
    }`);
      } else {
        // Regular parameter
        const parameterSchema = {
          type: property.type,
          example: property.example,
        };

        if (property.maxLength) {
          parameterSchema.maxLength = property.maxLength;
        }
        if (property.enum) {
          parameterSchema.enum = property.enum;
        }

        parameters.push(`
    {
      name: '${fieldName}',
      in: 'query',
      description: '**[Optional]** ',
      required: false,
      schema: ${JSON.stringify(parameterSchema, null, 8).replace(/"/g, "'")},
    }`);
      }
    }

    return parameters.length > 0 ? parameters.join(',') : '';
  }

  /**
   * Add moment import to documentation
   */
  addMomentImport(documentation) {
    // Check if moment is already imported
    if (!documentation.includes("const moment = require('moment')")) {
      // Add moment import after faker import
      documentation = documentation.replace(
        "const { faker } = require('@faker-js/faker');",
        "const moment = require('moment');\nconst { faker } = require('@faker-js/faker');"
      );
    }

    return documentation;
  }

  /**
   * Save documentation to file
   */
  async saveDocumentation(documentation, tableName, groupName) {
    try {
      // Create docs directory structure based on group
      const docsDir = path.resolve(__dirname, '../docs/paths', groupName);
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      // Generate filename
      const fileName = `${tableName}.docs.js`;
      const filePath = path.join(docsDir, fileName);

      // Write file
      fs.writeFileSync(filePath, documentation, 'utf-8');

      console.log(`📄 Documentation saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save documentation: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  pluralize(word) {
    // Simple pluralization rules
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) {
      return word + 'es';
    }
    if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
      return word.slice(0, -1) + 'ies';
    }
    return word + 's';
  }
}

// =============================================================================
// SCRIPT EXECUTION
// =============================================================================
if (require.main === module) {
  const generator = new CrudDocsGenerator();
  generator.run().catch(console.error);
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = CrudDocsGenerator;
