'use strict';

const { Model, DataTypes } = require('sequelize');

// Table that stores important updated information.

const TABLE_NAME = 'logs_update';
const MODEL_NAME = 'logsUpdate';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key to identify each update log.',
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
      'Data of the person responsible for updating the registry. In JSON format in case the user or account is subsequently deleted.',
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      this.setDataValue('oldData', JSON.parse(JSON.stringify(value)));
    },
    comment: 'Old information of the record in JSON format or similar.',
    field: 'old_data',
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      this.setDataValue('newData', JSON.parse(JSON.stringify(value)));
    },
    comment: 'New updated information of the record in JSON format or similar.',
    field: 'new_data',
  },
  tableModel: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      const object = { tableName: value.getTableName(), modelName: value.name };

      this.setDataValue('tableModel', object);
    },
    comment: 'Name of the affected table with the name of its respective model.',
    field: 'table_model',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
    comment:
      'Date and time when the record was updated. This is more useful for debugging purposes than for information.',
    field: 'updated_at',
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
