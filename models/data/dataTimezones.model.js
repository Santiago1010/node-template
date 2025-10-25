'use strict';

const { Model, DataTypes } = require('sequelize');

// Table that stores time zones.

const TABLE_NAME = 'data_timezones';
const MODEL_NAME = 'dataTimezones';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key for identifying each time zone.',
  },
  idContinent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'geo_continents',
      column: 'id',
      model: 'geoContinents',
      key: 'id',
    },
    comment:
      'ID of the continent to which the time zone belongs. This facilitates more efficient filtering of the required time zones.',
    field: 'id_continent',
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: 'name_timezone',
    comment: 'International name or identifier of the time zone (in "Continent/Zone" format).',
  },
  utc: {
    type: DataTypes.STRING(6),
    allowNull: false,
    comment: 'Coordinated Universal Time (UTC) offset of each time zone.',
  },
};

class ExtendedModel extends Model {
  static associate(_) {
    // Indexes
    // this.belongsTo(models.geoContinents, {
    //   foreignKey: 'idContinent',
    //   targetKey: 'id',
    //   as: 'continent',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // References
    // this.hasMany(models.geoCities, {
    //   foreignKey: 'idTimezone',
    //   sourceKey: 'id',
    //   as: 'cities',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
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
