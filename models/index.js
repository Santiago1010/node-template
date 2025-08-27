'use strict';

const fs = require('fs');
const path = require('path');
const { PATHS } = require('../helpers/constants.helper');
const basename = PATHS.MODELS;

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
 * @returns {Object} - Object with direct model references for IDE navigation
 */
const setupModels = (sequelize) => {
  const modelFiles = getAllFiles(__dirname);
  const models = [];
  const modelExports = {}; // Para exportar referencias directas

  // Primera pasada: recopilar archivos de modelos
  for (let i = 0; i < modelFiles.length; i++) {
    const file = modelFiles[i];
    if (file !== basename && file.endsWith('.model.js')) {
      models.push(file);
    }
  }

  // Segunda pasada: inicializar modelos
  for (let i = 0; i < models.length; i++) {
    const file = models[i];
    const { Schema, ExtendedModel } = require(file);
    ExtendedModel.init(Schema, ExtendedModel.config(sequelize));

    // Agregar referencia directa para navegación IDE
    const modelName = ExtendedModel.name;
    modelExports[modelName] = ExtendedModel;

    // También agregar al sequelize.models para compatibilidad
    sequelize.models[modelName] = ExtendedModel;
  }

  // Tercera pasada: configurar asociaciones
  for (let i = 0; i < models.length; i++) {
    const file = models[i];
    const { ExtendedModel } = require(file);
    if (ExtendedModel.associate) {
      ExtendedModel.associate(sequelize.models);
    }
  }

  // Retornar tanto sequelize como las referencias directas
  return {
    sequelize,
    models: modelExports,
  };
};

module.exports = setupModels;
