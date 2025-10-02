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
const SCRIPT_NAME = 'Generate CRUD Docs';
const REQUIRED_ARGS = 2;

// Faker mapping for different data types based on MySQL column types
const FAKER_MAPPINGS = {
  varchar: (length) => {
    const l = Math.min(length || 255, 255);
    return `faker.string.alphanumeric(${l})`;
  },
  char: (length) => `faker.string.alphanumeric(${Math.min(length || 10, 10)})`,
  text: () => 'faker.lorem.sentences(10)',
  longtext: () => 'faker.lorem.paragraphs(2)',
  mediumtext: () => 'faker.lorem.sentences(5)',
  tinytext: () => 'faker.lorem.sentence()',
  tinyint: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  smallint: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  mediumint: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  int: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  integer: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  bigint: (min, max) => `faker.number.int({ min: ${min}, max: ${max} })`,
  float: (precision) => `faker.number.float({ min: 0.1, max: 1000.0, precision: ${precision || 0.01} })`,
  decimal: (precision) => `faker.number.float({ min: 0.1, max: 1000.0, precision: ${precision || 0.01} })`,
  double: (precision) => `faker.number.float({ min: 0.1, max: 1000.0, precision: ${precision || 0.01} })`,
  real: (precision) => `faker.number.float({ min: 0.1, max: 1000.0, precision: ${precision || 0.01} })`,
  numeric: (precision) => `faker.number.float({ min: 0.1, max: 1000.0, precision: ${precision || 0.01} })`,
  boolean: () => 'faker.datatype.boolean()',
  bool: () => 'faker.datatype.boolean()',
  datetime: () => "moment(faker.date.future()).format('YYYY-MM-DD HH:mm:ss')",
  timestamp: () => "moment(faker.date.future()).format('YYYY-MM-DD HH:mm:ss')",
  date: () => "moment(faker.date.future()).format('YYYY-MM-DD')",
  time: () => "moment(faker.date.recent()).format('HH:mm:ss')",
  year: () => 'faker.date.recent().getFullYear()',
  json: () => 'faker.helpers.objectValue({ key1: "value1", key2: "value2" })',
  blob: () => '"base64encodeddata"',
  tinyblob: () => '"base64encodeddata"',
  mediumblob: () => '"base64encodeddata"',
  longblob: () => '"base64encodeddata"',
  binary: () => '"binarydata"',
  varbinary: () => '"binarydata"',
  geometry: () => '"POINT(0 0)"',
  point: () => '"POINT(0 0)"',
  linestring: () => '"LINESTRING(0 0,1 1,2 2)"',
  polygon: () => '"POLYGON((0 0,10 0,10 10,0 10,0 0))"',
  multipoint: () => '"MULTIPOINT(0 0,1 1,2 2)"',
  multilinestring: () => '"MULTILINESTRING((0 0,1 1,2 2),(3 3,4 4,5 5))"',
  multipolygon: () => '"MULTIPOLYGON(((0 0,10 0,10 10,0 10,0 0)),((20 20,30 20,30 30,20 30,20 20)))"',
  geometrycollection: () => '"GEOMETRYCOLLECTION(POINT(0 0),LINESTRING(0 0,1 1,2 2))"',
  set: (values) => `faker.helpers.arrayElements([${values.join(', ')}])`,
  default: () => 'faker.lorem.word()',
};

class CrudDocsGenerator {
  constructor() {
    this.crudHelper = new CrudHelper();
    this.startTime = performance.now();
    this.foreignKeyReferences = new Map();
  }

  async run() {
    try {
      console.log(`\n🚀 Starting ${SCRIPT_NAME}...`);

      const { tableName, singularName } = this.validateArguments();
      const { groupName, tagName, pluralName } = this.crudHelper.extractPrefixInfo(tableName);
      const tableData = await this.analyzeTable(tableName);

      await this.analyzeForeignKeys(tableData);

      const documentation = await this.generateDocumentation(tableData, singularName, pluralName, tagName);
      await this.saveDocumentation(documentation, tableName, groupName);

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
        if (this.crudHelper.shouldSkipField(columnName)) continue;
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

  async analyzeForeignKeys(tableData) {
    console.log(`🔗 Analyzing foreign keys for table: ${tableData.tableName}`);

    for (const [columnName, columnDetails] of Object.entries(tableData.columnDetails)) {
      if (this.crudHelper.isForeignKey(columnName, columnDetails)) {
        try {
          const referencedTable = await this.crudHelper.getReferencedTable(tableData.tableName, columnName);
          if (referencedTable) {
            const { tagName, operationId } = this.calculateReferenceInfo(referencedTable);
            this.foreignKeyReferences.set(columnName, {
              referencedTable,
              tagName,
              operationId,
            });
            console.log(
              `🔗 Foreign key detected: ${columnName} -> ${referencedTable} (Tag: ${tagName}, Op: ${operationId})`
            );
          }
        } catch (error) {
          console.warn(`⚠️  Could not analyze foreign key ${columnName}: ${error.message}`);
        }
      }
    }
  }

  calculateReferenceInfo(tableName) {
    const { tagName, pluralName } = this.crudHelper.extractPrefixInfo(tableName);
    const capitalizedPlural = formatCapitalize(pluralName);
    const operationId = `getList${capitalizedPlural}`;

    return { tagName, operationId };
  }

  async generateDocumentation(tableData, singularName, pluralName, tagName) {
    try {
      let documentation = await this.crudHelper.getTemplate('docs', 'crud');
      const methodNames = this.crudHelper.generateMethodNames(singularName, pluralName);

      documentation = this.replaceTemplatePlaceholders(documentation, methodNames, tagName);
      documentation = this.insertPropertySchemas(documentation, tableData);
      documentation = this.addMomentImport(documentation);

      if (this.foreignKeyReferences.size > 0) {
        documentation = this.addSetReferenceImport(documentation);
      }

      return documentation;
    } catch (error) {
      throw new Error(`Failed to generate documentation: ${error.message}`);
    }
  }

  replaceTemplatePlaceholders(template, methodNames, tagName) {
    template = template.replace(/\{\{CRATE_NAME\}\}/g, methodNames.create);
    template = template.replace(/\{\{CREATE_NAME\}\}/g, methodNames.create);
    template = template.replace(/\{\{STATUS_NAME\}\}/g, methodNames.updateStatus);
    template = template.replace(/\{\{LIST_NAME\}\}/g, methodNames.list);
    template = template.replace(/\{\{DETAILS_NAME\}\}/g, methodNames.details);
    template = template.replace(/\{\{DELETE_NAME\}\}/g, methodNames.delete);
    template = template.replace(/\{\{TAG\}\}/g, `'${tagName}'`);
    template = template.replace(/updateTest/g, methodNames.update);

    return template;
  }

  insertPropertySchemas(documentation, tableData) {
    const { columnDetails } = tableData;

    const createRequiredCols = Object.keys(columnDetails).filter((colName) => {
      const col = columnDetails[colName];
      return col && this.crudHelper.isFieldRequired(colName, col);
    });

    const createRequired = JSON.stringify(createRequiredCols.map((c) => toCamelCase(c)));

    const createFields = Object.keys(columnDetails).filter((c) => {
      if (this.crudHelper.shouldSkipField(c)) return false;
      return true;
    });
    const createProperties = this.generatePropertiesObject(columnDetails, createFields);

    const updateFields = createFields.slice();
    const updateProperties = this.generatePropertiesObject(columnDetails, updateFields, true);

    const listParameters = this.generateListParameters(columnDetails);

    documentation = documentation.replace(/\{\{CRATE_PROPERTIES\}\}/g, createProperties);
    documentation = documentation.replace(/required: \[\]/, `required: ${createRequired}`);
    documentation = documentation.replace(/\{\{UPDATE_PROPERTIES\}\}/g, updateProperties);

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
      if (!columnDetails[fieldName] || this.crudHelper.shouldSkipField(fieldName)) continue;

      const column = columnDetails[fieldName];
      const property = this.analyzeColumnForProperty(column);
      const requiredFlag = column.NULLABLE === '1' || column.COLUMN_DEFAULT !== null || update ? false : true;

      const foreignKeyInfo = this.foreignKeyReferences.get(fieldName);

      lines.push(`            ${toCamelCase(fieldName)}: {`);
      lines.push(`              type: '${property.type}',`);

      if (foreignKeyInfo) {
        const description = column.COLUMN_COMMENT || 'Reference to related resource';
        lines.push(
          `              description: setReference(${requiredFlag}, '${description.replace(/'/g, "\\'")}', '${foreignKeyInfo.tagName}', '${foreignKeyInfo.operationId}'),`
        );
      } else {
        const requiredText = requiredFlag ? '**[Required]** ' : '**[Optional]** ';
        lines.push(
          `              description: '${requiredText}${(column.COLUMN_COMMENT || '').replace(/'/g, "\\'")}',`
        );
      }

      if (!foreignKeyInfo) {
        if (property.maxLength) {
          lines.push(`              maxLength: ${property.maxLength},`);
        }
        if (property.minimum !== undefined) {
          lines.push(`              min: ${property.minimum},`);
        }
        if (property.maximum !== undefined) {
          lines.push(`              max: ${property.maximum},`);
        }
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

    const lengthMatch = columnType.match(/\((\d+)\)/);
    const length = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;

    const precisionMatch = columnType.match(/\((\d+),(\d+)\)/);
    const precision = precisionMatch
      ? parseFloat('0.' + '0'.repeat(parseInt(precisionMatch[2], 10) - 1) + '1')
      : undefined;

    const isUnsigned = /unsigned/.test(columnType);

    if (columnType.includes('varchar') || columnType.includes('char')) {
      property.type = 'string';
      if (length) property.maxLength = length;
      property.example = columnType.includes('varchar')
        ? FAKER_MAPPINGS.varchar(length || 255)
        : FAKER_MAPPINGS.char(length || 10);
    } else if (columnType.includes('text')) {
      property.type = 'string';
      if (columnType.includes('tinytext')) {
        property.example = FAKER_MAPPINGS.tinytext();
      } else if (columnType.includes('mediumtext')) {
        property.example = FAKER_MAPPINGS.mediumtext();
      } else if (columnType.includes('longtext')) {
        property.example = FAKER_MAPPINGS.longtext();
      } else {
        property.example = FAKER_MAPPINGS.text();
      }
    } else if (
      columnType.includes('tinyint') ||
      columnType.includes('smallint') ||
      columnType.includes('mediumint') ||
      columnType.includes('int') ||
      columnType.includes('bigint')
    ) {
      const isBooleanField = fieldName.endsWith('_is') || fieldName.startsWith('is_');

      if (isBooleanField && columnType.includes('tinyint') && length === 1) {
        property.type = 'boolean';
        property.enum = [true, false];
        property.example = FAKER_MAPPINGS.boolean();
      } else {
        property.type = 'integer';

        let min, max;

        if (columnType.includes('tinyint')) {
          max = length ? Math.pow(10, length) - 1 : isUnsigned ? 255 : 127;
          min = 0;
        } else if (columnType.includes('smallint')) {
          max = isUnsigned ? 65535 : 32767;
          min = 0;
        } else if (columnType.includes('mediumint')) {
          max = isUnsigned ? 16777215 : 8388607;
          min = 0;
        } else if (columnType.includes('bigint')) {
          max = isUnsigned ? Number.MAX_SAFE_INTEGER : Math.floor(Number.MAX_SAFE_INTEGER / 2);
          min = 0;
        } else {
          max = isUnsigned ? 4294967295 : 2147483647;
          min = 0;
        }

        property.minimum = min;
        property.maximum = max;

        const mappingKey = columnType.includes('tinyint')
          ? 'tinyint'
          : columnType.includes('smallint')
            ? 'smallint'
            : columnType.includes('mediumint')
              ? 'mediumint'
              : columnType.includes('bigint')
                ? 'bigint'
                : 'int';
        property.example = FAKER_MAPPINGS[mappingKey](min, max);
      }
    } else if (
      columnType.includes('decimal') ||
      columnType.includes('numeric') ||
      columnType.includes('float') ||
      columnType.includes('double') ||
      columnType.includes('real')
    ) {
      property.type = 'number';
      const mappingKey =
        columnType.includes('decimal') || columnType.includes('numeric')
          ? 'decimal'
          : columnType.includes('float')
            ? 'float'
            : columnType.includes('double')
              ? 'double'
              : 'real';
      property.example = FAKER_MAPPINGS[mappingKey](precision);
    } else if (columnType.includes('boolean') || columnType.includes('bool')) {
      property.type = 'boolean';
      property.enum = [true, false];
      property.example = FAKER_MAPPINGS.boolean();
    } else if (columnType.includes('date') && !columnType.includes('datetime') && !columnType.includes('timestamp')) {
      property.type = 'string';
      property.format = 'date';
      property.example = FAKER_MAPPINGS.date();
    } else if (columnType.includes('datetime') || columnType.includes('timestamp')) {
      property.type = 'string';
      property.format = 'date-time';
      property.example = FAKER_MAPPINGS.datetime();
    } else if (columnType.includes('time')) {
      property.type = 'string';
      property.format = 'time';
      property.example = FAKER_MAPPINGS.time();
    } else if (columnType.includes('year')) {
      property.type = 'integer';
      property.minimum = 1901;
      property.maximum = 2155;
      property.example = FAKER_MAPPINGS.year();
    } else if (columnType.includes('json')) {
      property.type = 'object';
      property.example = FAKER_MAPPINGS.json();
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
    } else if (columnType.includes('set')) {
      property.type = 'array';
      property.items = { type: 'string' };
      const setMatch = columnType.match(/set\((.+)\)/);
      if (setMatch) {
        const setValues = setMatch[1].split(',').map((v) => v.trim().replace(/['"]/g, ''));
        property.example = FAKER_MAPPINGS.set(setValues.map((v) => `'${v}'`));
      } else {
        property.example = '[]';
      }
    } else if (columnType.includes('blob') || columnType.includes('binary')) {
      property.type = 'string';
      property.format = 'binary';
      const mappingKey = columnType.includes('tinyblob')
        ? 'tinyblob'
        : columnType.includes('mediumblob')
          ? 'mediumblob'
          : columnType.includes('longblob')
            ? 'longblob'
            : columnType.includes('varbinary')
              ? 'varbinary'
              : 'blob';
      property.example = FAKER_MAPPINGS[mappingKey] ? FAKER_MAPPINGS[mappingKey]() : FAKER_MAPPINGS.blob();
    } else if (
      columnType.includes('geometry') ||
      columnType.includes('point') ||
      columnType.includes('linestring') ||
      columnType.includes('polygon') ||
      columnType.includes('multi')
    ) {
      property.type = 'string';
      const geoType = columnType.includes('point')
        ? 'point'
        : columnType.includes('linestring')
          ? 'linestring'
          : columnType.includes('polygon')
            ? 'polygon'
            : columnType.includes('multipoint')
              ? 'multipoint'
              : columnType.includes('multilinestring')
                ? 'multilinestring'
                : columnType.includes('multipolygon')
                  ? 'multipolygon'
                  : columnType.includes('geometrycollection')
                    ? 'geometrycollection'
                    : 'geometry';
      property.example = FAKER_MAPPINGS[geoType]();
    } else {
      property.type = 'string';
      property.example = FAKER_MAPPINGS.default();
    }

    return property;
  }

  generateListParameters(columnDetails) {
    const parameters = [];

    const filterableFields = Object.keys(columnDetails).filter((fieldName) => {
      if (this.crudHelper.shouldSkipField(fieldName)) return false;

      const column = columnDetails[fieldName];
      const columnType = (column.COLUMN_TYPE || '').toLowerCase();

      const isEnum = columnType.includes('enum');
      const isForeignKey = this.crudHelper.isForeignKey(fieldName, column);

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
        const parameterSchema = { type: property.type };

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

  addSetReferenceImport(documentation) {
    if (!documentation.includes("const { setReference } = require('../schemas/params/dynamic.params');")) {
      const requireRegex = /const .+ = require\(.+\);/g;
      const matches = [...documentation.matchAll(requireRegex)];

      if (matches.length > 0) {
        const lastRequire = matches[matches.length - 1];
        const insertPosition = lastRequire.index + lastRequire[0].length;

        documentation =
          documentation.slice(0, insertPosition) +
          "\nconst { setReference } = require('../schemas/params/dynamic.params');" +
          documentation.slice(insertPosition);
      } else {
        const lines = documentation.split('\n');
        let insertIndex = 0;

        while (
          insertIndex < lines.length &&
          (lines[insertIndex].trim().startsWith('//') || lines[insertIndex].trim() === '')
        ) {
          insertIndex++;
        }

        lines.splice(insertIndex, 0, "const { setReference } = require('../schemas/params/dynamic.params');");
        documentation = lines.join('\n');
      }
    }

    return documentation;
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

  async saveDocumentation(documentation, tableName, groupName) {
    try {
      const namesParts = tableName.split('_');
      const pluralName = namesParts.slice(1).join('_');
      const fileName = toCamelCase(pluralName);

      const folderPath = await this.crudHelper.createFolder('DOCS_PATHS', groupName, '');
      const filePath = await this.crudHelper.createFile(folderPath, `${fileName}.docs`, documentation);

      console.log(`📄 Documentation saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save documentation: ${error.message}`);
    }
  }
}

if (require.main === module) {
  const generator = new CrudDocsGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudDocsGenerator;
