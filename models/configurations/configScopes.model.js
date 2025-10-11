'use strict';

const { Model, DataTypes } = require('sequelize');

// System-wide scopes.

const TABLE_NAME = 'config_scopes';
const MODEL_NAME = 'configScopes';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for each scope.',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: 'scope_name_UN',
    comment: 'Unique scope name (in snake_case and separated by a colon).',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Description of the permissions that the scope has.',
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
    this.hasMany(models.configRolesHasScopes, {
      foreignKey: 'scopeId',
      sourceKey: 'id',
      as: 'rolesHasScopes',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.hasMany(models.usrAccountsHasScopes, {
      foreignKey: 'scopeId',
      sourceKey: 'id',
      as: 'accountsHasScopes',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });

    // Bridges
    this.belongsToMany(models.configRoles, {
      through: { model: models.configRolesHasScopes },
      foreignKey: 'scopeId',
      otherKey: 'roleId',
      as: 'roles',
    });
    this.belongsToMany(models.usrAccounts, {
      through: { model: models.usrAccountsHasScopes },
      foreignKey: 'scopeId',
      otherKey: 'accountId',
      as: 'accounts',
    });
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
