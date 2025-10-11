'use strict';

const { Model, DataTypes } = require('sequelize');

const i18n = require('../../config/i18n');

// Table that stores roles and their availability.

const TABLE_NAME = 'config_roles';
const MODEL_NAME = 'configRoles';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key for identifying each rol.',
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
    comment: 'ID of the security level that the role can access.',
    field: 'security_level_id',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Role name.',
  },
  target: {
    type: DataTypes.ENUM('everyone', 'employee', 'client', 'provider', 'client_user', 'project'),
    allowNull: false,
    defaultValue: 'everyone',
    get() {
      const target = this.getDataValue('target');
      const translated = i18n.__('enums.target.' + target);

      return { original: target, translated };
    },
    comment: 'Defines who the profiles are available for (linked to the tables that store user information).',
  },
  targetInt: {
    type: DataTypes.VIRTUAL,
    get() {
      const target = this.getDataValue('target');
      const options = { everyone: 1, employee: 2, client: 3, provider: 4, client_user: 5, project: 6 };

      return options[target];
    },
    set(_) {
      throw new Error('You cannot assign a value to a virtual column.');
    },
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indicates whether the role is the default. There can only be one per target.',
    field: 'is_default',
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
    // this.belongsTo(models.configSecurityLevels, {
    //   foreignKey: 'securityLevelId',
    //   targetKey: 'id',
    //   as: 'securityLevel',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });

    // References
    // this.hasMany(models.docPermissions, {
    //   foreignKey: 'idRole',
    //   sourceKey: 'id',
    //   as: 'permissions',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.prjProjectsHasAccounts, {
    //   foreignKey: 'idRole',
    //   sourceKey: 'id',
    //   as: 'projectsHasAccounts',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    this.hasMany(models.usrAccounts, {
      foreignKey: 'rolId',
      sourceKey: 'id',
      as: 'accounts',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Bridges
    // this.belongsToMany(models.prjProjects, {
    //   through: { model: models.prjProjectsHasAccounts },
    //   foreignKey: 'idRole',
    //   otherKey: 'idProject',
    //   as: 'projects',
    // });
    // this.belongsToMany(models.usrAccounts, {
    //   through: { model: models.prjProjectsHasAccounts },
    //   foreignKey: 'idRole',
    //   otherKey: 'idAccount',
    //   as: 'accounts',
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
