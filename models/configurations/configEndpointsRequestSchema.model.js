'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Defines request parameters for API endpoints.

const TABLE_NAME = 'config_endpoints_request_schema';
const MODEL_NAME = 'configEndpointsRequestSchema';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Primary key. Unique auto-incrementing identifier for each request schema parameter record',
  },
  endpointId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'config_endpoints',
      column: 'id',
      model: 'configEndpoints',
      key: 'id',
    },
    comment:
      'Foreign key reference to the associated API endpoint. Identifies which endpoint this parameter belongs to',
    field: 'endpoint_id',
  },
  securityLevelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'config_security_levels',
      column: 'id',
      model: 'configSecurityLevels',
      key: 'id',
    },
    comment: 'ID of the security level required to use this property on the endpoint.',
    field: 'security_level_id',
  },
  fieldId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'config_endpoints_request_schema',
      column: 'id',
      model: 'configEndpointsRequestSchema',
      key: 'id',
    },
    comment:
      'ID of the field to which it belongs. This is used for cases where the field is an object or an array of objects.',
    field: 'field_id',
  },
  name: {
    type: DataTypes.TEXT('tiny'),
    allowNull: false,
    comment:
      'Canonical name of the request parameter as expected by the API (e.g. in URL, headers, or body). Case-sensitive',
  },
  location: {
    type: DataTypes.ENUM('body', 'params', 'query', 'header', 'auth_token'),
    allowNull: false,
    get() {
      const location = this.getDataValue('location');
      const translated = i18n.__('enums.location.' + location);

      return { original: location, translated };
    },
    comment: 'Field location in the request: body, parameters (path), query (URL), header, or auth_token',
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
  dataType: {
    type: DataTypes.ENUM('string', 'integer', 'boolean', 'array', 'object', 'file', 'float'),
    allowNull: false,
    get() {
      const dataType = this.getDataValue('dataType');
      const translated = i18n.__('enums.dataType.' + dataType);

      return { original: dataType, translated };
    },
    comment: 'Expected data type for the parameter. Defines how the input should be parsed and validated',
    field: 'data_type',
  },
  datatypeInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const dataType = this.getDataValue('dataType');
      const options = { string: 1, integer: 2, boolean: 3, array: 4, object: 5, file: 6, float: 7 };

      return options[dataType];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: '1',
    comment: 'Indicates if the parameter is mandatory (TRUE) or optional (FALSE) for the request',
    field: 'is_required',
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
    this.belongsTo(models.configEndpoints, {
      foreignKey: 'endpointId',
      targetKey: 'id',
      as: 'endpoint',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.configEndpointsRequestSchema, {
      foreignKey: 'fieldId',
      targetKey: 'id',
      as: 'field',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.configSecurityLevels, {
      foreignKey: 'securityLevelId',
      targetKey: 'id',
      as: 'securityLevel',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });

    // References
    this.hasMany(models.configEndpointsRequestSchema, {
      foreignKey: 'fieldId',
      sourceKey: 'id',
      as: 'schema',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.hasMany(models.configPagesEndpointsHasSchemas, {
      foreignKey: 'idEndpointField',
      sourceKey: 'id',
      as: 'pagesEndpointsHasSchemas',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Bridges
    this.belongsToMany(models.configPagesHasEndpoints, {
      through: { model: models.configPagesEndpointsHasSchemas },
      foreignKey: 'idEndpointField',
      otherKey: 'idPageEndpoint',
      as: 'endpoints',
    });
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
