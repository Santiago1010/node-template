'use strict';

const { Model, DataTypes } = require('sequelize');{{NEED_I18N}}

// {{TABLES_COMMENT}}

const TABLE_NAME = '{{TABLE_NAME}}';
const MODEL_NAME = '{{MODEL_NAME}}';

const Schema = {
{{SCHEMA}}
};

class ExtendedModel extends Model {
  static associate(models) {
    // Indexes
{{INDEXES}}
    // References
{{REFERENCES}}
    // Bridges
{{BRIDGES}}
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: TABLE_NAME,
      modelName: MODEL_NAME,
{{SOFT_DELETE}}
    };
  }
}

module.exports = { Schema, ExtendedModel };
