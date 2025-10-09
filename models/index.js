// =============================================================================
// SEQUELIZE MODEL LOADER - Automated Model Discovery and Initialization
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Recursively discovers and loads Sequelize model files from directory structure
// - Automatically initializes models with proper schema configuration
// - Handles model associations in correct dependency order
// - Provides direct model references for improved IDE navigation and development experience
//
// ARCHITECTURAL DECISIONS:
// - Uses recursive file discovery to support nested model directory structures
// - Implements three-pass initialization to ensure proper dependency resolution
// - Separates model collection, initialization, and association phases
// - Maintains compatibility with standard Sequelize models while enhancing developer experience
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Manual model imports: More explicit but requires maintenance on model changes
// - Sequelize CLI auto-load: Tighter integration but less flexible configuration
// - Dynamic require with file patterns: Simpler but less robust for complex structures
// - Chose recursive discovery for maximum flexibility in project organization
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n) where n is number of model files
// - Space complexity: O(m) where m is depth of directory tree
// - File system operations: Minimal through synchronous directory traversal
// - Initialization overhead: Linear with number of models
//
// SECURITY CONSIDERATIONS:
// - Validates file extensions to prevent loading non-model files
// - Uses explicit path joining to prevent directory traversal attacks
// - No dynamic code evaluation - uses standard require() for module loading
// - Model schemas should implement their own input validation
//
// USAGE EXAMPLES:
// - Basic initialization:
//   const setupModels = require('./model-loader');
//   const { models, sequelize } = setupModels(sequelizeInstance);
//
// - Direct model access:
//   const { User, Product } = models;
//   const users = await User.findAll();
//
// - Integration with existing Sequelize projects:
//   // Models are also available through sequelize.models
//   const users = await sequelize.models.User.findAll();
//
// MAINTENANCE & TROUBLESHOOTING:
// - Ensure model files follow naming convention (*.model.js)
// - Verify model associations don't create circular dependencies
// - Check file permissions for model directory access
// - Monitor for changes in Sequelize initialization patterns
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 12+ with ES6 support
// - Compatible with Sequelize 6+ ORM
// - File system dependency for model discovery
// - Path resolution using Node.js path module
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs'); // File system operations for model discovery
const path = require('path'); // Path resolution for cross-platform compatibility

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { PATHS } = require('../utils/constants.util'); // Application path constants

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================
const MODEL_FILE_EXTENSION = '.model.js'; // Model file extension
const basename = PATHS.MODELS; // Base model directory path

/**
 * Recursively retrieves all files from a directory structure
 * @description Traverses directory tree to collect all file paths
 * @param {string} dirPath - Absolute path to the directory to scan
 * @param {Array<string>} [arrayOfFiles=[]] - Accumulator for recursive file collection
 * @returns {Array<string>} Array of absolute file paths found in directory tree
 * @throws {Error} If directory cannot be read or accessed
 *
 * @example
 * // Basic usage
 * const allFiles = getAllFiles('./models');
 *
 * @example
 * // With existing file array
 * const files = [];
 * getAllFiles('./models', files);
 *
 * @complexity Time: O(n) where n is total files + directories, Space: O(d) where d is directory depth
 * @since Version 1.0.0
 * @see {@link fs.readdirSync} for file system reading
 * @see {@link path.join} for path resolution
 */
const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // Recursive case: directory - traverse deeper
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Base case: file - add to collection
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
};

/**
 * Sequelize Model Initialization System
 * @description Discovers, initializes, and configures Sequelize models with automatic association handling
 * @param {Object} sequelize - Configured Sequelize instance for database connection
 * @returns {Object} Object containing sequelize instance and direct model references
 * @throws {Error} If model files cannot be loaded or initialized
 *
 * @example
 * // Basic usage with Sequelize instance
 * const sequelize = new Sequelize(config);
 * const { models, sequelize } = setupModels(sequelize);
 *
 * @example
 * // Advanced usage with existing models
 * const { User, Product } = setupModels(sequelize).models;
 * const users = await User.findAll({ include: Product });
 *
 * @complexity Time: O(3n) where n is number of models, Space: O(n) for model storage
 * @since Version 1.0.0
 * @see {@link getAllFiles} for model discovery implementation
 */
const setupModels = (sequelize) => {
  // Phase 1: Model Discovery - Recursively find all model files
  const modelFiles = getAllFiles(__dirname);
  const models = [];
  const modelExports = {}; // Direct model references for IDE support

  // First pass: Collect model files matching naming pattern
  for (let i = 0; i < modelFiles.length; i++) {
    const file = modelFiles[i];

    // Skip the base file itself and include only model files
    if (file !== basename && file.endsWith(MODEL_FILE_EXTENSION)) {
      models.push(file);
    }
  }

  // Second pass: Initialize models with Sequelize
  for (let i = 0; i < models.length; i++) {
    const file = models[i];

    // Model files must export Schema and ExtendedModel
    const { Schema, ExtendedModel } = require(file);

    // Initialize model with schema and configuration
    ExtendedModel.init(Schema, ExtendedModel.config(sequelize));

    // Store direct reference for IDE navigation and development
    const modelName = ExtendedModel.name;
    modelExports[modelName] = ExtendedModel;

    // Maintain standard Sequelize models reference for compatibility
    sequelize.models[modelName] = ExtendedModel;
  }

  // Third pass: Configure model associations after all models are initialized
  for (let i = 0; i < models.length; i++) {
    const file = models[i];
    const { ExtendedModel } = require(file);

    // Call associate method if defined on model
    if (ExtendedModel.associate) {
      ExtendedModel.associate(sequelize.models);
    }
  }

  // Return both sequelize instance and direct model references
  return {
    sequelize,
    models: modelExports,
  };
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = setupModels;
