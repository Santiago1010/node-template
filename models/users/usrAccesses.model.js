'use strict';

const { Model, DataTypes } = require('sequelize');

// Log of account access and devices.

const TABLE_NAME = 'usr_accesses';
const MODEL_NAME = 'usrAccesses';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for each access.',
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
  deviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'usr_devices',
      column: 'id',
      model: 'usrDevices',
      key: 'id',
    },
    comment: 'ID of the device from which the access was recorded.',
    field: 'device_id',
  },
  idToken: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Unique ID of the encrypted JWT token (not the primary key because it is recommended to encrypt it).',
    field: 'id_token',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Date and time the access expires. Updated each time the token is refreshed.',
    field: 'expires_at',
  },
  isSafeMode: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: '0',
    comment: 'Indicates whether access was performed in safe mode.',
    field: 'is_safe_mode',
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
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.belongsTo(models.usrDevices, {
      foreignKey: 'deviceId',
      targetKey: 'id',
      as: 'device',
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
