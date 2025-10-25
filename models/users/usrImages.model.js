'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Profile and/or cover images for each account.

const TABLE_NAME = 'usr_images';
const MODEL_NAME = 'usrImages';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for each image.',
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
    comment: 'ID of the account to which the image belongs.',
    field: 'account_id',
  },
  type: {
    type: DataTypes.ENUM('profile', 'front_page'),
    allowNull: false,
    get() {
      const type = this.getDataValue('type');
      const translated = i18n.__('enums.type.' + type);

      return { original: type, translated };
    },
    comment: 'Indicates the type of account image.',
  },
  typeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const type = this.getDataValue('type');
      const options = { profile: 1, front_page: 2 };

      return options[type];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  path: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Image path.',
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
