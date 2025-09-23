'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Only test generator scripts.

const TABLE_NAME = 'test_table';
const MODEL_NAME = 'testTable';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for each test record.',
  },
  code: {
    type: DataTypes.STRING(25),
    allowNull: false,
    unique: 'code_UN',
    comment: 'Public and unique code for each test record.',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Record name.',
  },
  type: {
    type: DataTypes.ENUM('personal', 'external'),
    allowNull: false,
    defaultValue: 'personal',
    get() {
      const type = this.getDataValue('type');
      const translated = i18n.__('enums.type.' + type);

      return { original: type, translated };
    },
    comment: 'Record type.',
  },
  typeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const type = this.getDataValue('type');
      const options = { personal: 1, external: 2 };

      return options[type];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  description: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null,
    comment: 'Detailed description of the entire record.',
  },
  limit: {
    type: DataTypes.TINYINT(2),
    allowNull: false,
    comment: 'Test log limit.',
  },
  isUseful: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Whether it is a useful record or not.',
    field: 'is_useful',
  },
  quotas: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    comment: 'Number of places.',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Registration start date.',
    field: 'start_date',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date and time when the record was created.',
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
    comment: 'Date and time when the record was last modified.',
    field: 'updated_at',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment:
      'Date and time when the record was deactivated. If the value is null, it means the record is still active; otherwise, it indicates that the record has been deactivated (known as soft deletion), without removing the information from the table.',
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
      timestamps: true,
      paranoid: true,
    };
  }
}

module.exports = { Schema, ExtendedModel };
