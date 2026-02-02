'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// OTP codes for different purposes.

const TABLE_NAME = 'usr_otp_codes';
const MODEL_NAME = 'usrOtpCodes';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique identifier of each OTP code.',
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'code_UN',
    comment: 'Account ID associated with the OTP code.',
    field: 'account_id',
  },
  code: {
    type: DataTypes.STRING(8),
    allowNull: false,
    unique: 'code_UN',
    comment: 'OTP code.',
  },
  channel: {
    type: DataTypes.ENUM('sms', 'whatsapp', 'email'),
    allowNull: false,
    defaultValue: 'sms',
    unique: 'code_UN',
    get() {
      const channel = this.getDataValue('channel');
      const translated = i18n.__('enums.channel.' + channel);

      return { original: channel, translated };
    },
    comment: 'Channel where the code was sent for use.',
  },
  channelInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const channel = this.getDataValue('channel');
      const options = { sms: 1, whatsapp: 2, email: 3 };

      return options[channel];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  purpose: {
    type: DataTypes.ENUM('login', 'setup', 'transaction', 'sensitive_actions', 'secure_mode'),
    allowNull: false,
    unique: 'code_UN',
    get() {
      const purpose = this.getDataValue('purpose');
      const translated = i18n.__('enums.purpose.' + purpose);

      return { original: purpose, translated };
    },
    comment:
      'Purpose for which the OTP code was requested. Use login for user authentication, setup to enable two-factor authentication, transaction for in-app transactions, sensitive_actions for operations requiring elevated security, and secure_mode to disable secure mode.',
  },
  purposeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const purpose = this.getDataValue('purpose');
      const options = { login: 1, setup: 2, transaction: 3, sensitive_actions: 4, secure_mode: 5 };

      return options[purpose];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Deadline date and time for using the OTP code.',
    field: 'expires_at',
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Date and time the OTP code was successfully used.',
    field: 'used_at',
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
    this.belongsTo(models.usrAccounts, {
      foreignKey: 'accountId',
      targetKey: 'id',
      as: 'account',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
