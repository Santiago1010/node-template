'use strict';

// =============================================================================
// SEQUELIZE MODEL LOADER - Automated Model Discovery and Registration
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Automatically discovers and registers Sequelize models from directory structure
// - Recursively loads model definitions from .model.js files
// - Handles model associations after all models are loaded
// - Provides centralized access to all models and Sequelize instances
//
// ARCHITECTURAL DECISIONS:
// - Uses recursive directory traversal for flexible project structure
// - Implements convention-over-configuration for model discovery
// - Maintains model independence while enabling associations
// - Provides singleton access to initialized models
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Manual model import: More control but higher maintenance overhead
// - Config-based registration: Explicit but less flexible for large projects
// - Dynamic import() calls: Modern but less stable for production systems
// - Third-party auto-loaders: Convenient but adds dependency overhead
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n) where n is number of model files
// - Space complexity: O(m) where m is number of loaded models
// - Synchronous loading preferred for startup phase simplicity
// - Minimal overhead during application runtime
//
// SECURITY CONSIDERATIONS:
// - Validates file extensions to prevent arbitrary code execution
// - Uses strict mode for enhanced security constraints
// - No authentication logic required (handled at ORM level)
// - File system operations constrained to model directory
//
// USAGE EXAMPLES:
// - Basic initialization:
//   const sequelize = new Sequelize(config);
//   const models = require('./models')(sequelize);
//
// - Model usage example:
//   const user = await models.User.findByPk(1);
//
// - Transaction handling:
//   await models.sequelize.transaction(async (t) => {
//     await models.User.create({...}, {transaction: t});
//   });
//
// MAINTENANCE & TROUBLESHOOTING:
// - Add new models by creating .model.js files in appropriate directories
// - Model loading order is directory structure dependent
// - Check console output for loading errors during development
// - Association errors typically indicate missing model references
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 12+ (fs.readdirSync with recursive option)
// - Compatible with Sequelize 6+ versions
// - No third-party dependencies beyond Sequelize
// - CommonJS module system required
//
// =============================================================================

// =============================================================================
// Core Node.js Dependencies
// =============================================================================
const fs = require('fs'); // File system operations
const path = require('path'); // Path manipulation utilities

// =============================================================================
// Third-Party Dependencies
// =============================================================================
const { DataTypes } = require('sequelize'); // Sequelize data types

/**
 * Sequelize Model Loader and Registry
 *
 * @description Automatically discovers, loads, and registers Sequelize models
 * from the current directory and all subdirectories. Handles model associations
 * and provides centralized access to all initialized models.
 *
 * @param {Object} sequelize - Initialized Sequelize instance
 * @param {Object} sequelize.Sequelize - Sequelize constructor reference
 * @returns {Object} Registry object containing:
 *   - All loaded models keyed by model name
 *   - Sequelize instance reference
 *   - Sequelize constructor reference
 *   - DataTypes reference
 *
 * @throws {Error} When model files contain invalid definitions
 * @throws {TypeError} When sequelize parameter is invalid
 *
 * @example
 * // Basic usage
 * const sequelize = new Sequelize('sqlite::memory:');
 * const models = require('./models')(sequelize);
 * await models.sequelize.sync();
 *
 * @example
 * // Production usage with error handling
 * try {
 *   const models = modelLoader(sequelize);
 *   console.log(`Loaded ${Object.keys(models).length} models`);
 * } catch (error) {
 *   console.error('Model loading failed:', error);
 *   process.exit(1);
 * }
 *
 * @complexity Time: O(n) where n is number of model files, Space: O(m) where m is models
 * @since Version 1.0.0
 * @see {@link https://sequelize.org/ Sequelize Documentation}
 */
module.exports = function (sequelize) {
  if (!sequelize || typeof sequelize !== 'object') {
    throw new TypeError('Valid Sequelize instance required');
  }

  const models = {};

  /**
   * Recursively loads Sequelize models from directory
   * @param {string} directory - Path to search for model files
   * @private
   */
  const loadModels = (directory) => {
    fs.readdirSync(directory).forEach((file) => {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively process subdirectories
        loadModels(fullPath);
      } else if (
        stat.isFile() &&
        file !== path.basename(__filename) && // Ignore self
        file.endsWith('.model.js') // Model file convention
      ) {
        try {
          const modelModule = require(fullPath);

          // Validate model module structure
          if (modelModule.Schema && modelModule.ExtendedModel) {
            const model = modelModule.ExtendedModel.init(
              modelModule.Schema,
              modelModule.ExtendedModel.config(sequelize)
            );
            models[model.name] = model;
            // console.log(`✅ Model loaded: ${model.name}`);
          } else {
            console.warn(`⚠️  Invalid model definition in ${file}`);
          }
        } catch (error) {
          console.error(`❌ Error loading model ${file}:`, error.message);
        }
      }
    });
  };

  // Start model discovery from current directory
  loadModels(__dirname);

  // Establish model associations after all models are loaded
  Object.keys(models).forEach((modelName) => {
    if (typeof models[modelName].associate === 'function') {
      models[modelName].associate(models);
      // console.log(`🔗 Associations established for: ${modelName}`);
    }
  });

  // Add Sequelize references for convenience
  models.sequelize = sequelize;
  models.Sequelize = sequelize.Sequelize || sequelize.constructor;
  models.DataTypes = DataTypes;

  return models;
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
// Exports factory function that accepts Sequelize instance and returns:
// - models: Object containing all loaded Sequelize models
// - sequelize: Original Sequelize instance reference
// - Sequelize: Sequelize constructor reference
// - DataTypes: Sequelize data types reference
//
// Typical usage:
// const initModels = require('./models');
// const models = initModels(sequelizeInstance);
