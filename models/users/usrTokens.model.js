'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Table that stores the purpose and information of tokens.

const TABLE_NAME = 'usr_tokens';
const MODEL_NAME = 'usrTokens';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key for identifying each created token.',
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
    comment: "ID of the user's account for which the token was created.",
    field: 'account_id',
  },
  token: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: 'token_UN',
    comment: 'Form or content of the token.',
  },
  purpose: {
    type: DataTypes.ENUM('confirm_email', 'confirm_recovery_email', 'confirm_phone', 'recover_password'),
    allowNull: false,
    get() {
      const purpose = this.getDataValue('purpose');
      const translated = i18n.__('enums.purpose.' + purpose);

      return { original: purpose, translated };
    },
    comment: 'Purpose of the token.',
  },
  purposeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const purpose = this.getDataValue('purpose');
      const options = { confirm_email: 1, confirm_recovery_email: 2, confirm_phone: 3, recover_password: 4 };

      return options[purpose];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  expiresIn: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Indicates the date and time limit for the use of the token.',
    field: 'expires_in',
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Date and time the token was used.',
    field: 'used_at',
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
