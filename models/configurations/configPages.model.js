'use strict';

const { Model, DataTypes } = require('sequelize');

// Table that stores the application's frontend pages.

const TABLE_NAME = 'config_pages';
const MODEL_NAME = 'configPages';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key to identify each page.',
  },
  hostId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'config_hosts',
      column: 'id',
      model: 'configHosts',
      key: 'id',
    },
    comment: 'ID of the client to which the page belongs.',
    field: 'host_id',
  },
  pageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'config_pages',
      column: 'id',
      model: 'configPages',
      key: 'id',
    },
    comment: 'ID of the parent page to which the child belongs. If null, it is a "first-line page".',
    field: 'page_id',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Page name (extracted from Vue router 4).',
  },
  path: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment:
      'Path of the specific page for identification. It must be exactly the same as the path used by the end user to access the view.',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
    comment: 'Optional description of what can be done or viewed on the page.',
  },
  level: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: '1',
    comment: 'Indicates whether it is level 1, 2, or 3 (this being the last level allowed).',
  },
  requiresAuthorization: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: '1',
    comment: 'Indicates whether the page requires authorization to access it.',
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
    this.belongsTo(models.configPages, {
      foreignKey: 'pageId',
      targetKey: 'id',
      as: 'parent',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    this.belongsTo(models.configPages, {
      foreignKey: 'pageId',
      targetKey: 'id',
      as: 'parentPage',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    this.belongsTo(models.configHosts, {
      foreignKey: 'hostId',
      targetKey: 'id',
      as: 'host',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // References
    this.hasMany(models.configPages, {
      foreignKey: 'pageId',
      sourceKey: 'id',
      as: 'pages',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    // this.hasMany(models.configPagesHasEndpoints, {
    // 	foreignKey: 'idPage',
    // 	sourceKey: 'id',
    // 	as: 'pagesHasEndpoints',
    // 	onUpdate: 'CASCADE',
    // 	onDelete: 'CASCADE'
    // });

    // Bridges
    // this.belongsToMany(models.configEndpoints, {
    // 	through: { model: models.configPagesHasEndpoints },
    // 	foreignKey: 'idPage',
    // 	otherKey: 'idEndpoint',
    // 	as: 'endpoints'
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
