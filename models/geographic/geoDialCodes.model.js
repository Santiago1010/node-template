'use strict';

const { Model, DataTypes } = require('sequelize');

// Dialing codes for each country.

const TABLE_NAME = 'geo_dial_codes';
const MODEL_NAME = 'geoDialCodes';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique identifier for each dialing code.',
  },
  idCountry: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'code',
    comment: 'Country ID to which the dialing code belongs.',
    field: 'id_country',
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: 'code',
    comment: 'Dialing code.',
  },
  mask: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Mask for each number that uses the dialing code.',
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
    // this.belongsTo(models.geoCountries, {
    //   foreignKey: 'idCountry',
    //   targetKey: 'id',
    //   as: 'code',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.belongsTo(models.geoCountries, {
    //   foreignKey: 'idCountry',
    //   targetKey: 'id',
    //   as: 'country',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
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
