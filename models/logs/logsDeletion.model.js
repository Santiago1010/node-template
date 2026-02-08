'use strict';

const { Model, DataTypes } = require('sequelize');

// Table that stores information that has been deleted.

const TABLE_NAME = 'logs_deletion';
const MODEL_NAME = 'logsDeletion';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique primary key to identify each deletion log.',
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
      'Information about the person who deleted the record. This is stored in JSON format in case the person responsible is also deleted.',
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      this.setDataValue('oldData', JSON.parse(JSON.stringify(value)));
    },
    comment: 'Data from the record that was deleted. In JSON format for easier reading.',
    field: 'old_data',
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
  justification: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null,
    comment: 'Detailed justification for why the record was permanently deleted.',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Exact date and time when the record was deleted.',
    field: 'deleted_at',
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
