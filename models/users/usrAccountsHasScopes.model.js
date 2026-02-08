'use strict';

const { Model, DataTypes } = require('sequelize');

// Temporary scopes that a specific account can have.

const TABLE_NAME = 'usr_accounts_has_scopes';
const MODEL_NAME = 'usrAccountsHasScopes';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique identifier for each relationship between an account and a scope.',
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'usr_accounts',
      column: 'id',
      model: 'usrAccounts',
      key: 'id',
    },
    comment: 'Account ID.',
    field: 'account_id',
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
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment:
      'Specifies a date and time limit for the account to be eligible for the scope. If null, this indicates that the account will permanently have that scope.',
    field: 'expires_at',
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
    this.belongsTo(models.usrAccounts, {
      foreignKey: 'accountId',
      targetKey: 'id',
      as: 'account',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
