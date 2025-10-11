'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Registered devices for each account.

const TABLE_NAME = 'usr_devices';
const MODEL_NAME = 'usrDevices';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for each device.',
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
    comment: 'Account ID that owns this device.',
    field: 'account_id',
  },
  fingerprint: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: 'fingerprint_UN',
    comment: 'Unique hash identifying the device (based on user agent, IP pattern, etc).',
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: null,
    comment: 'Friendly name for the device (e.g., "iPhone de Juan", "Chrome en Windows").',
  },
  type: {
    type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'other'),
    allowNull: false,
    defaultValue: 'other',
    get() {
      const type = this.getDataValue('type');
      const translated = i18n.__('enums.type.' + type);

      return { original: type, translated };
    },
    comment: 'Type of device.',
  },
  typeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const type = this.getDataValue('type');
      const options = { desktop: 1, mobile: 2, tablet: 3, other: 4 };

      return options[type];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  browser: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
    comment: 'Browser name and version.',
  },
  os: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
    comment: 'Operating system.',
  },
  isTrusted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indicates whether the device is trusted.',
    field: 'is_trusted',
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indicates whether the device has been blocked.',
    field: 'is_blocked',
  },
  lastIp: {
    type: DataTypes.STRING(45),
    allowNull: true,
    defaultValue: null,
    comment: 'Last IP address used by this device.',
    field: 'last_ip',
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Last time this device was used.',
    field: 'last_used_at',
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
    comment: 'Soft delete timestamp.',
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
      onDelete: 'CASCADE',
    });

    // References
    this.hasMany(models.usrAccesses, {
      foreignKey: 'deviceId',
      sourceKey: 'id',
      as: 'accesses',
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
