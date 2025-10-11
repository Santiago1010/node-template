'use strict';

const { Model, DataTypes } = require('sequelize');

// Scopes that each role has.

const TABLE_NAME = 'config_roles_has_scopes';
const MODEL_NAME = 'configRolesHasScopes';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for the relationship between role and scope.',
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'config_roles',
      column: 'id',
      model: 'configRoles',
      key: 'id',
    },
    comment: 'Role ID.',
    field: 'role_id',
  },
  scopeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'config_scopes',
      column: 'id',
      model: 'configScopes',
      key: 'id',
    },
    comment: 'Scope ID.',
    field: 'scope_id',
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
    this.belongsTo(models.configRoles, {
      foreignKey: 'roleId',
      targetKey: 'id',
      as: 'role',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.belongsTo(models.configScopes, {
      foreignKey: 'scopeId',
      targetKey: 'id',
      as: 'scope',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });

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
