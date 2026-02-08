'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Table with the permissions of a role with the endpoints.

const TABLE_NAME = 'config_endpoints';
const MODEL_NAME = 'configEndpoints';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique primary key to identify each endpoint.',
  },
  method: {
    type: DataTypes.ENUM('post', 'get', 'put', 'patch', 'delete', 'options'),
    allowNull: false,
    unique: 'endpoint_UN',
    get() {
      const method = this.getDataValue('method');
      const translated = i18n.__('enums.method.' + method);

      return { original: method, translated };
    },
    comment: 'Method of the endpoint to which permission will be granted.',
  },
  methodInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const method = this.getDataValue('method');
      const options = { post: 1, get: 2, put: 3, patch: 4, delete: 5, options: 6 };

      return options[method];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  version: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: 'endpoint_UN',
    comment: 'Version identifier of the endpoint configuration',
  },
  endpointGroup: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: 'endpoint_UN',
    comment: 'Grouping of different endpoints',
    field: 'endpoint_group',
  },
  path: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: 'endpoint_UN',
    comment: 'Path of the endpoint to which permission will be granted.',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
    comment: "Optional description of the endpoint's function.",
  },
  requiresAuthorization: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: '1',
    comment: 'Indicates whether or not the endpoint requires authorization to be executed.',
    field: 'requires_authorization',
  },
  hasSensitiveInformation: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: '0',
    comment:
      'Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
    field: 'has_sensitive_information',
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

    // References
    this.hasMany(models.configEndpointsRequestSchema, {
      foreignKey: 'endpointId',
      sourceKey: 'id',
      as: 'schema',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    // this.hasMany(models.configPagesHasEndpoints, {
    //   foreignKey: 'idEndpoint',
    //   sourceKey: 'id',
    //   as: 'pagesHasEndpoints',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });

    // Bridges
    // this.belongsToMany(models.configPages, {
    //   through: { model: models.configPagesHasEndpoints },
    //   foreignKey: 'idEndpoint',
    //   otherKey: 'idPage',
    //   as: 'pages',
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
