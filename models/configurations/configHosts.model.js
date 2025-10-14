'use strict';

const { Model, DataTypes } = require('sequelize');

// Supported hosts that can use the API.

const TABLE_NAME = 'config_hosts';
const MODEL_NAME = 'configHosts';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for each host.',
  },
  url: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: 'url_UN',
    comment: 'URN of the allowed hosts.',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Indicates whether this is the default host or not. There can only be one.',
    field: 'is_default',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date and time when the record was created in the table.',
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
  static associate(models) {
    // Indexes

    // References
    this.hasMany(models.configPages, {
      foreignKey: 'hostId',
      sourceKey: 'id',
      as: 'pages',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

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
