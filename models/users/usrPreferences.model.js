'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Table that stores user preferences (settings).

const TABLE_NAME = 'usr_preferences';
const MODEL_NAME = 'usrPreferences';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key for identifying each created preference.',
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
    comment: 'ID of the account to which the preferences belong.',
    field: 'account_id',
  },
  languageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the language selected by the user as their preference.',
    field: 'language_id',
  },
  timezoneId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the time zone that the user selects as their preference for the platform.',
    field: 'timezone_id',
  },
  theme: {
    type: DataTypes.ENUM('ligth', 'dark'),
    allowNull: false,
    defaultValue: 'ligth',
    get() {
      const theme = this.getDataValue('theme');
      const translated = i18n.__('enums.theme.' + theme);

      return { original: theme, translated };
    },
    comment: 'Preferred theme type (color scheme) of the platform for the user.',
  },
  themeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const theme = this.getDataValue('theme');
      const options = { ligth: 1, dark: 2 };

      return options[theme];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  whatsapp: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: '0',
    comment: 'Indicates whether you allow receiving notifications via WhatsApp.',
  },
  sms: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: '1',
    comment: 'Indicates whether you allow receiving SMS notifications.',
  },
  email: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: '1',
    comment: 'Indicates whether you allow receiving notifications and/or advertising by email.',
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
      timestamps: false,
      paranoid: false,
    };
  }
}

module.exports = { Schema, ExtendedModel };
