'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Table that stores the languages and their available versions.

const TABLE_NAME = 'data_languages';
const MODEL_NAME = 'dataLanguages';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique primary key for identifying each language.',
  },
  idFlag: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'data_flags',
      column: 'id',
      model: 'dataFlags',
      key: 'id',
    },
    comment: 'ID of the flag that will be displayed alongside the language.',
    field: 'id_flag',
  },
  abbreviation: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Language abbreviation, typically used for internationalization libraries.',
  },
  version: {
    type: DataTypes.STRING(4),
    allowNull: true,
    defaultValue: null,
    comment:
      'Version of the language for different parts of the world that speak the same language. This is completely optional.',
  },
  name: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Name of the language, written in multiple languages for internationalization.',
  },
  description: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment:
      'Explanatory description of the language, provided in English as it is the standard in software development.',
  },
  orientation: {
    type: DataTypes.ENUM('L2R', 'R2L', 'T2BL2R', 'T2BR2L'),
    allowNull: false,
    defaultValue: 'L2R',
    get() {
      const orientation = this.getDataValue('orientation');
      const translated = i18n.__('enums.orientation.' + orientation);

      return { original: orientation, translated };
    },
    comment:
      'The language can have different writing orientations: left-to-right (L2R), right-to-left (R2L), top-to-bottom with left-to-right direction (T2BL2R), or top-to-bottom with right-to-left direction (T2BR2L).',
  },
  orientationInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const orientation = this.getDataValue('orientation');
      const options = { L2R: 1, R2L: 2, T2BL2R: 3, T2BR2L: 4 };

      return options[orientation];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  public: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: '0',
    comment: 'Indicates whether this is a selectable language to change the platform language.',
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
    // this.belongsTo(models.dataFlags, {
    //   foreignKey: 'idFlag',
    //   targetKey: 'id',
    //   as: 'flag',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // References
    // this.hasMany(models.geoCountriesHasLanguages, {
    //   foreignKey: 'idLanguage',
    //   sourceKey: 'id',
    //   as: 'countriesHasLanguages',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // Bridges
    // this.belongsToMany(models.geoCountries, {
    //   through: { model: models.geoCountriesHasLanguages },
    //   foreignKey: 'idLanguage',
    //   otherKey: 'idCountry',
    //   as: 'countries',
    // });
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
