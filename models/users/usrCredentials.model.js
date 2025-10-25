'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Credentials available for each account.

const TABLE_NAME = 'usr_credentials';
const MODEL_NAME = 'usrCredentials';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique ID for each credential.',
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
    comment: 'ID of the account to which the credential belongs.',
    field: 'account_id',
  },
  credentialType: {
    type: DataTypes.ENUM('email', 'phone', 'document', 'internal_code'),
    allowNull: false,
    get() {
      const credentialType = this.getDataValue('credentialType');
      const translated = i18n.__('enums.credentialType.' + credentialType);

      return { original: credentialType, translated };
    },
    comment: 'Type of credential.',
    field: 'credential_type',
  },
  credentialtypeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const credentialType = this.getDataValue('credentialType');
      const options = { email: 1, phone: 2, document: 3, internal_code: 4 };

      return options[credentialType];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  credentialValue: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Credential value.',
    field: 'credential_value',
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Timestamp of when the credential was verified.',
    field: 'verified_at',
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
