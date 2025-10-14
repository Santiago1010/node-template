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
const { toCamelCase } = require('../utils/strings.util');

// =============================================================================
// SCRIPT CONFIGURATION
// =============================================================================
const SCRIPT_NAME = 'Generate CRUD Endpoints';
const REQUIRED_ARGS = 2;

class CrudEndpointsGenerator {
  constructor() {
    this.crudHelper = new CrudHelper();
    this.startTime = performance.now();
  }

  async run() {
    try {
      console.log(`\n🚀 Starting ${SCRIPT_NAME}...`);

      await this.crudHelper.initialize();

      const { tableName, singularName } = this.validateArguments();
      const { groupName, pluralName } = this.crudHelper.extractPrefixInfo(tableName);

      const endpointContent = await this.generateEndpoints(singularName, pluralName);
      await this.saveEndpoints(endpointContent, groupName, pluralName);

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
      console.error(`📋 Usage: npx generate-endpoints <table_name> <singular_name>`);
      console.error(`📝 Example: npx generate-endpoints usr_users user`);
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

  async generateEndpoints(singularName, pluralName) {
    try {
      console.log(`🔧 Generating endpoints for: ${pluralName}`);

      let endpointContent = await this.crudHelper.getTemplate('crud', 'endpoints');

      const controllerName = toCamelCase(`${pluralName} controller`);
      const pluralCamelName = toCamelCase(pluralName);

      // Generate method names using CrudHelper
      const methodNames = this.crudHelper.generateMethodNames(singularName, pluralName);

      endpointContent = this.replaceTemplatePlaceholders(endpointContent, {
        controllerName,
        pluralName: pluralCamelName,
        methodNames,
      });

      console.log(`📝 Endpoints generated successfully`);
      return endpointContent;
    } catch (error) {
      throw new Error(`Failed to generate endpoints: ${error.message}`);
    }
  }

  replaceTemplatePlaceholders(template, replacements) {
    const { controllerName, pluralName, methodNames } = replacements;

    template = template.replace(/\{\{CONTROLLER_NAME\}\}/g, controllerName);
    template = template.replace(/\{\{PLURAL_NAME\}\}/g, pluralName);

    // Replace method name placeholders
    template = template.replace(/\{\{CREATE_METHOD\}\}/g, methodNames.create);
    template = template.replace(/\{\{UPDATE_STATUS_METHOD\}\}/g, methodNames.updateStatus);
    template = template.replace(/\{\{LIST_METHOD\}\}/g, methodNames.list);
    template = template.replace(/\{\{DETAILS_METHOD\}\}/g, methodNames.details);
    template = template.replace(/\{\{UPDATE_METHOD\}\}/g, methodNames.update);
    template = template.replace(/\{\{DELETE_METHOD\}\}/g, methodNames.delete);

    return template;
  }

  async saveEndpoints(endpointContent, groupName, pluralName) {
    try {
      const fileName = `${toCamelCase(pluralName)}.routes`;
      const folderPath = await this.crudHelper.createFolder('ROUTES_DEFAULT', groupName, '');
      const filePath = await this.crudHelper.createFile(folderPath, fileName, endpointContent);

      console.log(`📄 Endpoints saved to: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to save endpoints: ${error.message}`);
    }
  }
}

if (require.main === module) {
  const generator = new CrudEndpointsGenerator();
  generator.run().catch(console.error);
}

module.exports = CrudEndpointsGenerator;
