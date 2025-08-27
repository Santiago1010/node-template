'use strict';

// =============================================================================
// SEQUELIZE MODEL LOADER - Automated Model Discovery and Association
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Automatically discovers and loads Sequelize model definitions from the file system
// - Recursively scans directories for model files with specific naming pattern (.model.js)
// - Initializes models with Sequelize connection and establishes associations
// - Provides centralized access to all models and Sequelize components
//
// ARCHITECTURAL DECISIONS:
// - Uses recursive directory traversal to support nested model organization
// - Implements runtime model discovery rather than static imports for maintainability
// - Follows Sequelize's model initialization pattern with custom configuration support
// - Centralizes model management to simplify database module consumption
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Static imports: Would require manual updates when adding new models
// - Config-based registration: Less flexible than file system discovery
// - Singleton pattern: Chosen over dependency injection for simplicity in this context
// - Dynamic require: Selected over import() for synchronous initialization requirements
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n) where n is number of model files
// - Space complexity: O(m) where m is number of loaded models
// - Initial load time proportional to number of model files
// - Association setup time proportional to model relationships
//
// SECURITY CONSIDERATIONS:
// - Validates file extensions to prevent loading non-JavaScript files
// - Excludes self from loading to prevent circular references
// - Implements error boundaries to prevent single model failure from crashing entire system
//
// USAGE EXAMPLES:
// - Basic initialization: const models = require('./models');
// - Model access: const User = models.User;
// - Raw query execution: models.sequelize.query('SELECT...');
//
// MAINTENANCE & TROUBLESHOOTING:
// - Add new models by creating <name>.model.js files in models directory
// - Debug loading issues by checking console output for ✅/❌ symbols
// - Association errors typically indicate missing model references
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 12+ for recursive directory traversal features
// - Compatible with Sequelize 6+ versions
// - File system operations require appropriate directory permissions
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs'); // File system operations for model discovery
const path = require('path'); // Path manipulation utilities

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { DataTypes } = require('sequelize'); // Sequelize data types for model definitions

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const databaseConnection = require('../config/database/connection'); // Database connection instance

/**
 * Recursively loads Sequelize model definitions from directory and subdirectories
 * @description Discovers and initializes model files following the (.model.js) pattern
 * @param {string} directory - Path to scan for model files
 * @returns {void}
 * @throws {Error} When directory traversal fails or model initialization fails
 * @complexity Time: O(n), Space: O(d) where n is files, d is directory depth
 * @since v1.0.0
 */
const loadModels = (directory) => {
  fs.readdirSync(directory).forEach((file) => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories to support nested model organization
      loadModels(fullPath);
    } else if (
      stat.isFile() &&
      file !== path.basename(__filename) && // Prevent self-loading
      file.endsWith('.model.js') // Enforce model naming convention
    ) {
      try {
        const modelModule = require(fullPath);

        // Validate model module structure
        if (modelModule.Schema && modelModule.ExtendedModel) {
          const model = modelModule.ExtendedModel.init(
            modelModule.Schema,
            modelModule.ExtendedModel.config(databaseConnection.sequelize)
          );

          models[model.name] = model;
          console.log(`✅ Modelo cargado: ${model.name}`);
        }
      } catch (error) {
        // Error boundary: Prevent single model failure from breaking entire loading process
        console.error(`❌ Error cargando modelo ${file}:`, error.message);
      }
    }
  });
};

const models = {};

// Initial model loading from current directory
loadModels(__dirname);

/**
 * Establishes model associations after all models are loaded
 * @description Processes associate method on models to set up relationships
 * @param {Object} models - Collection of loaded model instances
 * @returns {void}
 * @throws {Error} When association configuration fails
 * @since v1.0.0
 */
Object.keys(models).forEach((modelName) => {
  if (typeof models[modelName].associate === 'function') {
    models[modelName].associate(models);
    console.log(`🔗 Asociaciones establecidas para: ${modelName}`);
  }
});

// =============================================================================
// MODULE EXPORTS
// =============================================================================
models.sequelize = databaseConnection.sequelize; // Sequelize instance for raw queries
models.Sequelize = databaseConnection.sequelize.Sequelize || databaseConnection.sequelize.constructor; // Sequelize constructor
models.DataTypes = DataTypes; // Sequelize data types for model definitions

module.exports = models;
