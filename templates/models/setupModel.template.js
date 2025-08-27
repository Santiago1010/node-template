'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

/**
 * Recursively retrieves all files from a directory.
 * @param {string} dirPath - The directory path.
 * @param {Array<string>} [arrayOfFiles=[]] - The array to accumulate file paths.
 * @returns {Array<string>} - An array of file paths.
 */
const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
};

/**
 * Sets up Sequelize models by importing files ending with `.model.js`
 * and initializing them with the given Sequelize instance.
 * @param {Object} sequelize - The Sequelize instance.
 */
const setupModels = (sequelize) => {
  const modelFiles = getAllFiles(__dirname);
  const models = [];

  for (let i = 0; i < modelFiles.length; i++) {
    const file = modelFiles[i];
    if (file !== basename && file.endsWith('.model.js')) {
      models.push(file);
    }
  }

  for (let i = 0; i < models.length; i++) {
    const file = models[i];
    const { Schema, ExtendedModel } = require(file);
    ExtendedModel.init(Schema, ExtendedModel.config(sequelize));
  }

  for (let i = 0; i < models.length; i++) {
    const file = models[i];
    const { ExtendedModel } = require(file);
    if (ExtendedModel.associate) {
      ExtendedModel.associate(sequelize.models);
    }
  }
};

module.exports = setupModels;
