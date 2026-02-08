'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Additional and optional details for each user.

const TABLE_NAME = 'usr_users_details';
const MODEL_NAME = 'usrUsersDetails';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique auto-numerical ID for each record.',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'usr_users',
      column: 'id',
      model: 'usrUsers',
      key: 'id',
    },
    comment: 'ID of the user to whom these details belong.',
    field: 'user_id',
  },
  birthCirtyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'geo_cities',
      column: 'id',
      model: 'geoCities',
      key: 'id',
    },
    comment: 'Birth city ID.',
    field: 'birth_cirty_id',
  },
  residenceCityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'geo_cities',
      column: 'id',
      model: 'geoCities',
      key: 'id',
    },
    comment: 'Current city of residence.',
    field: 'residence_city_id',
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
    comment: "User's date of birth.",
    field: 'birth_date',
  },
  gender: {
    type: DataTypes.ENUM('M', 'F', 'O', 'N'),
    allowNull: true,
    defaultValue: null,
    get() {
      const gender = this.getDataValue('gender');
      const translated = i18n.__('enums.gender.' + gender);

      return { original: gender, translated };
    },
    comment: 'User gender.',
  },
  genderInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const gender = this.getDataValue('gender');
      const options = { M: 1, F: 2, O: 3, N: 4 };

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
  static associate(models) {
    // Indexes
    this.belongsTo(models.usrUsers, {
      foreignKey: 'userId',
      targetKey: 'id',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    // this.belongsTo(models.geoCities, {
    //   foreignKey: 'birthCirtyId',
    //   targetKey: 'id',
    //   as: 'birthCity',
    //   onUpdate: 'SET NULL',
    //   onDelete: 'SET NULL',
    // });
    // this.belongsTo(models.geoCities, {
    //   foreignKey: 'residenceCityId',
    //   targetKey: 'id',
    //   as: 'residenceCity',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });

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
