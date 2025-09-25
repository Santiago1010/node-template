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
const { toCamelCase } = require('../helpers/strings.helper');

// =============================================================================
// SCRIPT CONFIGURATION
// =============================================================================
const SCRIPT_NAME = 'Generate CRUD Docs';
const REQUIRED_ARGS = 2;

// Faker mapping for different data types based on MySQL column types
const FAKER_MAPPINGS = {
  // String types with length consideration
  varchar: (length) => {
    const l = Math.min(length || 255, 255);
    return `faker.string.alphanumeric(${l})`;
  },
  char: (length) => `faker.string.alphanumeric(${Math.min(length || 10, 10)})`,
  text: () => 'faker.lorem.sentences(10)',
  longtext: () => 'faker.lorem.paragraphs(2)',
  mediumtext: () => 'faker.lorem.sentences(5)',

  // Numeric types
  int: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  integer: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  bigint: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  float: () => 'faker.number.float({ min: 0.1, max: 100.0, precision: 0.01 })',
  decimal: () => 'faker.number.float({ min: 0.1, max: 1000.0, precision: 0.01 })',
  double: () => 'faker.number.float({ min: 0.1, max: 1000.0, precision: 0.01 })',
  real: () => 'faker.number.float({ min: 0.1, max: 100.0, precision: 0.01 })',

  // Tiny integer (often used for small ranges)
  tinyint: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,

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

// Nueva plantilla
const NEW_TEMPLATE = `// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');
const {
  commonListParams,
  activeParams,
  activeBody,
  detailsParams,
  identifierParam,
} = require('../../../schemas/params/common.params');

// =============================== BASE PATH =============================== //
const {{CRATE_NAME}} = standardRequest('post', {
  tags: [{{TAG}}],
  operationId: '{{CRATE_NAME}}',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: [],
          properties: {
            {{CRATE_PROPERTIES}}
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const {{STATUS_NAME}} = standardRequest('patch', {
  tags: [{{TAG}}],
  operationId: '{{STATUS_NAME}}',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: [],
          properties: {
            ids: {
              type: 'array',
              description: '**[Required]** Array of IDs of the records to be deactivated or reactivated.',
              items: { type: 'integer' },
              example: faker.helpers.arrayElements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
            },
            ...activeBody,
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const {{LIST_NAME}} = standardRequest('get', {
  tags: [{{TAG}}],
  operationId: '{{LIST_NAME}}',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const {{DETAILS_NAME}} = standardRequest('get', {
  tags: [{{TAG}}],
  operationId: '{{DETAILS_NAME}}',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateTest = standardRequest('put', {
  tags: [{{TAG}}],
  operationId: 'updateTest',
  description: '',
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            {{UPDATE_PROPERTIES}}
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const {{DELETE_NAME}} = standardRequest('delete', {
  tags: [{{TAG}}],
  operationId: '{{DELETE_NAME}}',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...{{CRATE_NAME}}, ...{{STATUS_NAME}}, ...{{LIST_NAME}} };
const pathWithId = { ...{{DETAILS_NAME}}, ...updateTest, ...{{DELETE_NAME}} };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };`;

class CrudDocsGenerator {
  constructor() {
    this.crudHelper = new CrudHelper();
    this.startTime = performance.now();
  }

  async run() {
    try {
      console.log(`\n🚀 Starting ${SCRIPT_NAME}...`);

      const { tableName, singularName } = this.validateArguments();
      const { groupName, tagName } = this.extractPrefixInfo(tableName);
      const tableData = await this.analyzeTable(tableName);
      const documentation = await this.generateDocumentation(tableData, singularName, tagName);
      await this.saveDocumentation(documentation, tableName, groupName, singularName);

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

  extractPrefixInfo(tableName) {
    const parts = tableName.split('_');
    const prefix = parts[0].toUpperCase();
    const groupName = PREFIXES[prefix] || 'general';
    const tagName = this.capitalize(groupName);

    console.log(`📂 Prefix: ${prefix}`);
    console.log(`📁 Group: ${groupName}`);
    console.log(`🏷️  Tag: ${tagName}`);

    return { prefix, groupName, tagName };
  }

  async analyzeTable(tableName) {
    try {
      console.log(`🔍 Analyzing table: ${tableName}`);

      const tableComment = await this.crudHelper.readTablesComment(tableName);
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

  shouldSkipField(fieldName) {
    const skipFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt'];
    return skipFields.includes(fieldName);
  }

  async generateDocumentation(tableData, singularName, tagName) {
    try {
      // Usar la nueva plantilla directamente en lugar de leerla de archivo
      let documentation = NEW_TEMPLATE;
      const methodNames = this.generateMethodNames(singularName);

      documentation = this.replaceTemplatePlaceholders(documentation, methodNames, tagName);
      documentation = this.insertPropertySchemas(documentation, tableData, singularName);
      documentation = this.addMomentImport(documentation);

      return documentation;
    } catch (error) {
      throw new Error(`Failed to generate documentation: ${error.message}`);
    }
  }

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

  replaceTemplatePlaceholders(template, methodNames, tagName) {
    // Support both 'CRATE_NAME' typo and 'CREATE_NAME' placeholder
    template = template.replace(/\{\{CRATE_NAME\}\}/g, methodNames.create);
    template = template.replace(/\{\{CREATE_NAME\}\}/g, methodNames.create);
    template = template.replace(/\{\{STATUS_NAME\}\}/g, methodNames.status);
    template = template.replace(/\{\{LIST_NAME\}\}/g, methodNames.list);
    template = template.replace(/\{\{DETAILS_NAME\}\}/g, methodNames.details);
    template = template.replace(/\{\{DELETE_NAME\}\}/g, methodNames.delete);

    template = template.replace(/\{\{TAG\}\}/g, `'${tagName}'`);
    template = template.replace(/updateTest/g, methodNames.update);

    return template;
  }

  insertPropertySchemas(documentation, tableData) {
    const { columnDetails } = tableData;

    // Compute createRequired based on columns metadata
    const createRequiredCols = Object.keys(columnDetails).filter((colName) => {
      const col = columnDetails[colName];
      if (!col) return false;
      if (this.shouldSkipField(colName)) return false;
      if (col.EXTRA && col.EXTRA.toLowerCase().includes('auto_increment')) return false;
      if (col.COLUMN_KEY && col.COLUMN_KEY.toUpperCase() === 'PRI') return false;
      const notNullable = col.NULLABLE === '0';
      const hasDefault = col.COLUMN_DEFAULT !== null && col.COLUMN_DEFAULT !== undefined;
      return notNullable && !hasDefault;
    });

    const createRequired = JSON.stringify(createRequiredCols.map((c) => toCamelCase(c)));

    // CREATE: properties must contain ALL columns; required only computed ones
    const createFields = Object.keys(columnDetails).filter((c) => {
      if (this.shouldSkipField(c)) return false;
      return true;
    });
    const createProperties = this.generatePropertiesObject(columnDetails, createFields);

    // UPDATE (PUT): include ALL fields and mark them as optional
    const updateFields = createFields.slice();
    const updateProperties = this.generatePropertiesObject(columnDetails, updateFields, true);

    // LIST parameters
    const listParameters = this.generateListParameters(columnDetails);

    // Replace CREATE properties placeholder
    documentation = documentation.replace(/\{\{CRATE_PROPERTIES\}\}/g, createProperties);

    // Replace CREATE required array
    documentation = documentation.replace(/required: \[\]/, `required: ${createRequired}`);

    // Replace UPDATE properties placeholder
    documentation = documentation.replace(/\{\{UPDATE_PROPERTIES\}\}/g, updateProperties);

    // Insert list parameters only if we have parameters
    if (listParameters) {
      documentation = documentation.replace(
        /parameters: \[\.\.\.commonListParams, \.\.\.activeParams\]/,
        `parameters: [\n    ...commonListParams,\n    ...activeParams,${listParameters}\n  ]`
      );
    }

    return documentation;
  }

  generatePropertiesObject(columnDetails, fields, update = false) {
    const lines = [];

    for (const fieldName of fields) {
      if (!columnDetails[fieldName] || this.shouldSkipField(fieldName)) continue;

      const column = columnDetails[fieldName];
      const property = this.analyzeColumnForProperty(column);
      const requiredFlag = column.NULLABLE === '1' || column.COLUMN_DEFAULT !== null || update ? false : true;
      const requiredText = requiredFlag ? '**[Required]** ' : '**[Optional]** ';

      lines.push(`            ${toCamelCase(fieldName)}: {`);
      lines.push(`              type: '${property.type}',`);
      lines.push(`              description: '${requiredText}${(column.COLUMN_COMMENT || '').replace(/'/g, "\\'")}',`);

      if (property.maxLength) {
        lines.push(`              maxLength: ${property.maxLength},`);
      }
      if (property.minimum !== undefined) {
        lines.push(`              min: ${property.minimum},`);
      }
      if (property.maximum !== undefined) {
        lines.push(`              max: ${property.maximum},`);
      }
      if (property.enum) {
        lines.push(`              enum: [${property.enum.map((v) => v).join(', ')}],`);
      }
      if (property.format) {
        lines.push(`              format: '${property.format}',`);
      }

      lines.push(`              example: ${property.example},`);
      lines.push(`            },`);
    }

    return lines.join('\n');
  }

  analyzeColumnForProperty(column) {
    const columnType = (column.COLUMN_TYPE || '').toLowerCase();
    const fieldName = (column.COLUMN_NAME || '').toLowerCase();
    const property = {};

    // Helper to extract length between parentheses
    const lengthMatch = columnType.match(/\((\d+)\)/);
    const length = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;

    // Strings
    if (columnType.includes('varchar') || columnType.includes('char') || columnType.includes('text')) {
      property.type = 'string';

      if (length && (columnType.includes('varchar') || columnType.includes('char'))) {
        property.maxLength = length;
      }

      if (columnType.includes('varchar')) {
        const l = property.maxLength || 255;
        property.example = FAKER_MAPPINGS.varchar(l);
      } else if (columnType.includes('char')) {
        const l = property.maxLength || 10;
        property.example = FAKER_MAPPINGS.char(l);
      } else {
        property.example = FAKER_MAPPINGS.text();
      }

      // Integers and tinyint
    } else if (
      columnType.includes('int') ||
      columnType.includes('tinyint') ||
      columnType.includes('bigint') ||
      columnType.includes('smallint') ||
      columnType.includes('mediumint')
    ) {
      // Detectar boolean basado en el patrón 'is_%' o '%_is'
      const isBooleanField = fieldName.startsWith('is_') || fieldName.endsWith('_is');

      if (isBooleanField && columnType.includes('tinyint') && length === 1) {
        property.type = 'boolean';
        property.enum = [true, false];
        property.example = FAKER_MAPPINGS.boolean();
      } else {
        property.type = 'integer'; // Usar 'integer' consistentemente

        let max, min;

        // Rangos específicos según el contexto del campo
        if (fieldName.includes('limit')) {
          // Para campos limit: rango 0-99
          min = 0;
          max = 99;
        } else if (fieldName.includes('quota') || fieldName.includes('quotas')) {
          // Para campos quotas: tipo integer con rango 0-9
          property.type = 'integer';
          min = 0;
          max = 9;
        } else if (columnType.includes('tinyint')) {
          max = length && length <= 2 ? Math.pow(10, length) - 1 : 99;
          min = /unsigned/.test(columnType) ? 0 : -max;
        } else {
          const len = length || 11;
          const exponent = Math.min(len, 15);
          max = Math.pow(10, exponent) - 1;
          if (max > Number.MAX_SAFE_INTEGER) max = Number.MAX_SAFE_INTEGER;
          min = /unsigned/.test(columnType) ? 0 : -max;
        }

        property.minimum = min;
        property.maximum = max;
        property.example = FAKER_MAPPINGS.integer(min, max);
      }

      // Numbers with decimals
    } else if (columnType.includes('decimal') || columnType.includes('float') || columnType.includes('double')) {
      property.type = 'number';
      property.example = FAKER_MAPPINGS.decimal();

      // Boolean
    } else if (columnType.includes('boolean') || columnType.includes('bool')) {
      property.type = 'boolean';
      property.enum = [true, false];
      property.example = FAKER_MAPPINGS.boolean();

      // Date (date only)
    } else if (columnType.includes('date') && !columnType.includes('datetime') && !columnType.includes('timestamp')) {
      property.type = 'string';
      // Solo añadir format para algunos casos específicos, no para start_date
      if (!fieldName.includes('start_date')) {
        property.format = 'date';
      }
      property.example = FAKER_MAPPINGS.date();

      // Datetime/timestamp
    } else if (columnType.includes('datetime') || columnType.includes('timestamp')) {
      property.type = 'string';
      property.format = 'date-time';
      property.example = FAKER_MAPPINGS.datetime();

      // Enum
    } else if (columnType.includes('enum')) {
      property.type = 'string';
      const enumMatch = columnType.match(/enum\((.+)\)/);
      if (enumMatch) {
        const enumValues = enumMatch[1].split(',').map((v) => v.trim().replace(/['"]/g, ''));
        property.enum = enumValues.map((v) => `'${v}'`);
        property.example = `faker.helpers.arrayElement([${enumValues.map((v) => `'${v}'`).join(', ')}])`;
      } else {
        property.example = FAKER_MAPPINGS.default();
      }
    } else {
      // fallback
      property.type = 'string';
      property.example = FAKER_MAPPINGS.default();
    }

    return property;
  }

  generateListParameters(columnDetails) {
    const parameters = [];

    const filterableFields = Object.keys(columnDetails).filter((fieldName) => {
      if (this.shouldSkipField(fieldName)) return false;

      const column = columnDetails[fieldName];
      const columnType = (column.COLUMN_TYPE || '').toLowerCase();

      const isEnum = columnType.includes('enum');
      const isForeignKey =
        (column.COLUMN_KEY && column.COLUMN_KEY.toUpperCase() === 'MUL') || fieldName.endsWith('_id');

      return isEnum || isForeignKey;
    });

    for (const fieldName of filterableFields) {
      const column = columnDetails[fieldName];
      const property = this.analyzeColumnForProperty(column);
      const camelField = toCamelCase(fieldName);

      if (property.format === 'date') {
        parameters.push(
          `\n    {\n      name: '${camelField}From',\n      in: 'query',\n      description: '**[Optional]** ',\n      required: false,\n      schema: { type: 'string', format: 'date' }\n    },\n    {\n      name: '${camelField}To',\n      in: 'query',\n      description: '**[Optional]** ',\n      required: false,\n      schema: { type: 'string', format: 'date' }\n    }`
        );
      } else {
        const parameterSchema = {
          type: property.type,
        };

        if (property.maxLength) parameterSchema.maxLength = property.maxLength;
        if (property.enum) {
          parameterSchema.enum = property.enum.map((v) => v.replace(/'/g, ''));
        }

        parameters.push(
          `\n    {\n      name: '${camelField}',\n      in: 'query',\n      description: '**[Optional]** ',\n      required: false,\n      schema: ${JSON.stringify(parameterSchema).replace(/"/g, "'")}\n    }`
        );
      }
    }

    return parameters.length > 0 ? parameters.join(',') : '';
  }

  addMomentImport(documentation) {
    if (
      !documentation.includes("const moment = require('moment')") &&
      (documentation.includes('moment(') || documentation.includes('.format('))
    ) {
      documentation = documentation.replace(
        "const { faker } = require('@faker-js/faker');",
        "const moment = require('moment');\nconst { faker } = require('@faker-js/faker');"
      );
    }

    return documentation;
  }

  async saveDocumentation(documentation, _, groupName, singularName) {
    try {
      const docsDir = path.resolve(__dirname, '../docs/paths', groupName);
      if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

      // Use the singularName provided to name the file
      const fileName = `${toCamelCase(singularName)}.docs.js`;
      const filePath = path.join(docsDir, fileName);

      fs.writeFileSync(filePath, documentation, 'utf-8');

      console.log(`📄 Documentation saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save documentation: ${error.message}`);
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  pluralize(word) {
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) {
      return word + 'es';
    }
    if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
      return word.slice(0, -1) + 'ies';
    }
    return word + 's';
  }
}

if (require.main === module) {
  const generator = new CrudDocsGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudDocsGenerator;
