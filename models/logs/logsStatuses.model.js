'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// State change log (soft delete).

const TABLE_NAME = 'logs_statuses';
const MODEL_NAME = 'logsStatuses';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique identifier for each log.',
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
    comment: 'Unique identifier for each record.',
  },
  tableModel: {
    type: DataTypes.JSON,
    allowNull: false,
    set(value) {
      const object = { tableName: value.getTableName(), modelName: value.name };

      this.setDataValue('tableModel', object);
    },
    comment: 'Name of the affected table with its respective model name.',
    field: 'table_model',
  },
  type: {
    type: DataTypes.ENUM('reactivation', 'deactivation'),
    allowNull: false,
    get() {
      const type = this.getDataValue('type');
      const translated = i18n.__('enums.type.' + type);

      return { original: type, translated };
    },
    comment: 'Type of operation: Whether the record was deactivated or reactivated.',
  },
  typeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const type = this.getDataValue('type');
      const options = { reactivation: 1, deactivation: 2 };

      return options[type];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
    comment: 'Date and time the status was changed.',
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
