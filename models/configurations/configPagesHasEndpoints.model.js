'use strict';

const { Model, DataTypes } = require('sequelize');

// Relationship of endpoint usage on each page.

const TABLE_NAME = 'config_pages_has_endpoints';
const MODEL_NAME = 'configPagesHasEndpoints';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier for each page-endpoint relationship.',
  },
  pageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'page_endpoint',
    comment: 'Page ID.',
    field: 'page_id',
  },
  endpointId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'page_endpoint',
    comment: 'Endpoint ID.',
    field: 'endpoint_id',
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
    this.belongsTo(models.configPages, {
      foreignKey: 'pageId',
      targetKey: 'id',
      as: 'page',
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

    // References
    // this.hasMany(models.configPagesEndpointsHasSchemas, {
    //   foreignKey: 'idPageEndpoint',
    //   sourceKey: 'id',
    //   as: 'pagesEndpointsHasSchemas',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });

    // // Bridges
    // this.belongsToMany(models.configEndpointsRequestSchema, {
    //   through: { model: models.configPagesEndpointsHasSchemas },
    //   foreignKey: 'idPageEndpoint',
    //   otherKey: 'idEndpointField',
    //   as: 'schema',
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
