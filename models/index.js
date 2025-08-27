'use strict';

const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const models = {};

  const loadModels = (directory) => {
    fs.readdirSync(directory).forEach((file) => {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        loadModels(fullPath);
      } else if (stat.isFile() && file !== path.basename(__filename) && file.endsWith('.model.js')) {
        try {
          const modelModule = require(fullPath);
          if (modelModule.Schema && modelModule.ExtendedModel) {
            const model = modelModule.ExtendedModel.init(
              modelModule.Schema,
              modelModule.ExtendedModel.config(sequelize)
            );
            models[model.name] = model;
            console.log(`✅ Modelo cargado: ${model.name}`);
          }
        } catch (error) {
          console.error(`❌ Error cargando modelo ${file}:`, error.message);
        }
      }
    });
  };

  loadModels(__dirname);

  Object.keys(models).forEach((modelName) => {
    if (typeof models[modelName].associate === 'function') {
      models[modelName].associate(models);
      console.log(`🔗 Asociaciones establecidas para: ${modelName}`);
    }
  });

  models.sequelize = sequelize;
  models.Sequelize = sequelize.Sequelize || sequelize.constructor;
  models.DataTypes = DataTypes;

  return models;
};
