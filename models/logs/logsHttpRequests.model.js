'use strict';

const { Model, DataTypes } = require('sequelize');

// Table for storing logs of HTTP requests.

const TABLE_NAME = 'logs_http_requests';
const MODEL_NAME = 'logsHttpRequests';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: "Unique primary key for identifying each HTTPS's request.",
  },
  accessId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'usr_accesses',
      column: 'id',
      model: 'usrAccesses',
      key: 'id',
    },
    comment: 'Access ID that performed the action. With this you can get account, user and device.',
    field: 'access_id',
  },
  pageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'config_pages',
      column: 'id',
      model: 'configPages',
      key: 'id',
    },
    comment: 'Page ID of the page where the request was made.',
    field: 'page_id',
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
    comment: 'Endpoint ID of the endpoint where the request was made.',
    field: 'endpoint_id',
  },
  idRequest: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: 'request_id_UN',
    comment: 'Unique ID of the request.',
    field: 'id_request',
  },
  idOperation: {
    type: DataTypes.STRING(36),
    allowNull: true,
    defaultValue: null,
    comment: 'Unique ID of the operation.',
    field: 'id_operation',
  },
  path: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: 'Request route. Used to record its parameters.',
  },
  query: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Request query parameters.',
  },
  headers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Request headers (exclude sensitive).',
  },
  body: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Request body (exclude sensitive).',
  },
  httpCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'HTTP response code.',
    field: 'http_code',
  },
  responseBody: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    comment: 'Response body (exclude sensitive).',
    field: 'response_body',
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'Status code of the response. Mostly used for errors and to differentiate HTTP response codes.',
    field: 'status_code',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
    comment: 'Error message.',
    field: 'error_message',
  },
  errorStack: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
    comment: 'Error stack (just in development).',
    field: 'error_stack',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date and time when the record was created in the table.',
    field: 'created_at',
  },
};

class ExtendedModel extends Model {
  static associate(models) {
    // Indexes
    this.belongsTo(models.usrAccesses, {
      foreignKey: 'accessId',
      targetKey: 'id',
      as: 'access',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.configEndpoints, {
      foreignKey: 'endpointId',
      targetKey: 'id',
      as: 'endpoint',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.configPages, {
      foreignKey: 'pageId',
      targetKey: 'id',
      as: 'page',
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
