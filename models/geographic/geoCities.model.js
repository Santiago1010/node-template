'use strict';

const { Model, DataTypes } = require('sequelize');

// Table that stores cities.

const TABLE_NAME = 'geo_cities';
const MODEL_NAME = 'geoCities';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key for identifying each city.',
  },
  idSubDivision: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'geo_political_divisions',
      column: 'id',
      model: 'geoSubDivisions',
      key: 'id',
    },
    comment: 'ID of the subdivision to which the city belongs.',
    field: 'id_sub_division',
  },
  idTimezone: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'data_timezones',
      column: 'id',
      model: 'dataTimezones',
      key: 'id',
    },
    comment:
      'ID of the time zone governing the city. This setup allows for different time zones within a country or even a subdivision.',
    field: 'id_timezone',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Original name of the city.',
  },
};

class ExtendedModel extends Model {
  static associate(models) {
    // Indexes
    // this.belongsTo(models.geoSubDivisions, {
    //   foreignKey: 'idSubDivision',
    //   targetKey: 'id',
    //   as: 'subDivision',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.belongsTo(models.dataTimezones, {
    //   foreignKey: 'idTimezone',
    //   targetKey: 'id',
    //   as: 'timezone',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });

    // References
    // this.hasMany(models.configTaxes, {
    //   foreignKey: 'idCity',
    //   sourceKey: 'id',
    //   as: 'taxes',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.hasMany(models.geoCountries, {
    //   foreignKey: 'idCapital',
    //   sourceKey: 'id',
    //   as: 'countries',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    this.hasMany(models.usrUsersDetails, {
      foreignKey: 'birthCirtyId',
      sourceKey: 'id',
      as: 'details',
      onUpdate: 'SET NULL',
      onDelete: 'SET NULL',
    });

    // Bridges
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: TABLE_NAME,
      modelName: MODEL_NAME,
    };
  }
}

module.exports = { Schema, ExtendedModel };
