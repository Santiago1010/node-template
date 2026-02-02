'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Maps which fields are used in page-endpoint relationships

const TABLE_NAME = 'config_pages_endpoints_has_schemas';
const MODEL_NAME = 'configPagesEndpointsHasSchemas';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Primary key, unique identifier for each page-endpoint-field relationship.',
  },
  pageEndpointId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'page_endpoint_schema_UN',
    comment: 'Foreign key referencing the page-endpoint relationship.',
    field: 'page_endpoint_id',
  },
  endpointFieldId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'page_endpoint_schema_UN',
    comment: 'Foreign key referencing the specific endpoint field configuration.',
    field: 'endpoint_field_id',
  },
  location: {
    type: DataTypes.ENUM('body', 'params', 'query', 'header', 'auth_token'),
    allowNull: false,
    get() {
      const location = this.getDataValue('location');
      const translated = i18n.__('enums.location.' + location);

      return { original: location, translated };
    },
    comment: 'Field location in the request from the page: body, parameters (path), query (URL), header, or auth_token',
  },
  locationInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const location = this.getDataValue('location');
      const options = { body: 1, params: 2, query: 3, header: 4, auth_token: 5 };

      return options[location];
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
    this.belongsTo(models.configPagesHasEndpoints, {
      foreignKey: 'pageEndpointId',
      targetKey: 'id',
      as: 'pageEndpoint',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.configEndpointsRequestSchema, {
      foreignKey: 'endpointFieldId',
      targetKey: 'id',
      as: 'endpointField',
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
