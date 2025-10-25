'use strict';

const { Model, DataTypes } = require('sequelize');

// Table that stores creation logs for certain tables.

const TABLE_NAME = 'logs_creation';
const MODEL_NAME = 'logsCreation';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key to identify each creation log.',
  },
  rowId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the affected record.',
    field: 'row_id',
  },
  responsible: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      this.setDataValue('responsible', JSON.parse(JSON.stringify(value)));
    },
    comment:
      'Information about the user who created the record. This is stored as JSON in case the account and/or user is deleted.',
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      this.setDataValue('data', JSON.parse(JSON.stringify(value)));
    },
    comment: 'Information about the created record. It is stored as JSON in case the record is later deleted.',
  },
  tableModel: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      const object = { tableName: value.getTableName(), modelName: value.name };

      this.setDataValue('tableModel', object);
    },
    comment: 'Table name affects the name of its respective model.',
    field: 'table_model',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment:
      'Date and time when the record was created. This is more useful for debugging purposes than for information.',
    field: 'created_at',
  },
};

class ExtendedModel extends Model {
  static associate(_) {
    // Indexes
    // References
    // Bridges
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: TABLE_NAME,
      modelName: MODEL_NAME,
      timestamps: false,
      paranoid: false,
    };
  }
}

module.exports = { Schema, ExtendedModel };
