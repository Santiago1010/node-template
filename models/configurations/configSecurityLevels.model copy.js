'use strict';

const { Model, DataTypes } = require('sequelize');

// Application access security levels.

const TABLE_NAME = 'config_security_levels';
const MODEL_NAME = 'configSecurityLevels';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Autonumeric identifier for each security level.',
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: 'slug_UN',
    comment: 'Name of the security level in slug format.',
  },
  name: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Name of the security level with internationalization.',
  },
  priority: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    comment: '1 = least sensitive ... n = most sensitive.',
  },
  description: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Detailed description of each security level with internationalization.',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Indicate whether this is a default level. Only one can be marked as default.',
    field: 'is_default',
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
  static associate(models) {
    // Indexes

    // References
    this.hasMany(models.configEndpointsRequestSchema, {
      foreignKey: 'securityLevelId',
      sourceKey: 'id',
      as: 'schema',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.hasMany(models.configRoles, {
      foreignKey: 'securityLevelId',
      sourceKey: 'id',
      as: 'roles',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
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
