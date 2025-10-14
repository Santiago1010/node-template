'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

const { formatNames } = require('../../utils/strings.util');

// Table that stores personal information of each user.

const TABLE_NAME = 'usr_employees';
const MODEL_NAME = 'usrEmployees';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key for identifying each user.',
  },
  idCountry: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'ID of the country where the user was born (their country of birth).',
    field: 'id_country',
  },
  idCity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'ID of the city where the user currently resides.',
    field: 'id_city',
  },
  idIdentificationType: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: "ID of the user's identification type.",
    field: 'id_identification_type',
  },
  document: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: null,
    unique: 'document_number',
    comment: 'Identification document number of the user, without special characters, punctuation, or letters.',
  },
  completeName: {
    type: DataTypes.VIRTUAL,
    get() {
      const firstName = this.getDataValue('firstName');
      const secondName = this.getDataValue('secondName');
      const firstLastName = this.getDataValue('firstLastName');
      const secondLastName = this.getDataValue('secondLastName');

      const name = [firstName, secondName, firstLastName, secondLastName].filter(Boolean).join(' ');

      return formatNames(name);
    },
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'First name of the user.',
    field: 'first_name',
  },
  secondName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
    comment: 'Middle name(s) of the user.',
    field: 'second_name',
  },
  firstLastname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'First surname of the user (usually the paternal surname).',
    field: 'first_lastname',
  },
  secondLastname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
    comment: 'Second surname(s) of the user.',
    field: 'second_lastname',
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
    comment: 'Date of birth of the user. Typically used for birthday greetings and/or age validation.',
  },
  address: {
    type: DataTypes.TEXT('tiny'),
    allowNull: true,
    defaultValue: null,
    comment: "Physical address of the user's residence.",
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'undefined'),
    allowNull: false,
    defaultValue: 'undefined',
    get() {
      const gender = this.getDataValue('gender');
      const translated = i18n.__('enums.gender.' + gender);

      return { original: gender, translated };
    },
    comment: 'Biological sex assigned at birth or gender identity, if applicable.',
  },
  genderInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const gender = this.getDataValue('gender');
      const options = { male: 1, female: 2, other: 3, undefined: 4 };

      return options[gender];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
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
  static associate(_) {
    // Indexes
    // References
    // this.hasMany(models.docVersions, {
    //   foreignKey: 'idCreator',
    //   sourceKey: 'id',
    //   as: 'versions',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.finCashboxes, {
    //   foreignKey: 'idContract',
    //   sourceKey: 'id',
    //   as: 'cashboxes',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
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
