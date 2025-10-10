'use strict';

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Model, DataTypes } = require('sequelize');

// Contains information about a user's account.

const TABLE_NAME = 'usr_accounts';
const MODEL_NAME = 'usrAccounts';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique primary key for identifying each account belonging to a user.',
  },
  rolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'config_roles',
      column: 'id',
      model: 'configRoles',
      key: 'id',
    },
    comment: 'ID of the role that holds the account.',
    field: 'rol_id',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'usr_users',
      column: 'id',
      model: 'usrUsers',
      key: 'id',
    },
    comment: 'User/customer ID associated with the account.',
    field: 'user_id',
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'usr_employees',
      column: 'id',
      model: 'usrEmployees',
      key: 'id',
    },
    comment: 'ID of the user to whom the account belongs.',
    field: 'employee_id',
  },
  dialCodeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      table: 'geo_dial_codes',
      column: 'id',
      model: 'geoDialCodes',
      key: 'id',
    },
    comment: 'Mobile number code ID. Cannot be null if a cell phone number exists.',
    field: 'dial_code_id',
  },
  internalCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: 'account_code_UN',
    comment: 'Internal code assigned to each account.',
    field: 'internal_code',
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: 'email_UN',
    comment: 'Primary email address for the account to access the platform.',
  },
  emailConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Indicates whether the email address has already been confirmed (other than null) or not (null).',
    field: 'email_confirmed_at',
  },
  recoveryEmail: {
    type: DataTypes.STRING(150),
    allowNull: true,
    defaultValue: null,
    comment: 'Email account where recovery data will be sent, in case the primary account cannot be accessed.',
    field: 'recovery_email',
  },
  recoveryEmailConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Indicates whether the recovery email has already been confirmed (other than null) or not (null).',
    field: 'recovery_email_confirmed_at',
  },
  mobileNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: null,
    comment: 'Mobile phone number of the account.',
    field: 'mobile_number',
  },
  mobileNumberConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Indicates whether the mobile number has already been confirmed (other than null) or not (null).',
    field: 'mobile_number_confirmed_at',
  },
  password: {
    type: DataTypes.BLOB,
    allowNull: false,
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
    // // Indexes
    // this.belongsTo(models.usrEmployees, {
    //   foreignKey: 'employeeId',
    //   targetKey: 'id',
    //   as: 'employee',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.belongsTo(models.configRoles, {
    //   foreignKey: 'rolId',
    //   targetKey: 'id',
    //   as: 'rol',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.belongsTo(models.usrUsers, {
    //   foreignKey: 'userId',
    //   targetKey: 'id',
    //   as: 'user',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.belongsTo(models.geoDialCodes, {
    //   foreignKey: 'dialCodeId',
    //   targetKey: 'id',
    //   as: 'dialCode',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // // References
    // this.hasMany(models.configEndpointsHasPermissions, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'endpointsHasPermissions',
    //   onUpdate: 'NO ACTION',
    //   onDelete: 'NO ACTION',
    // });
    // this.hasMany(models.configPagesHasPermissions, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'pagesHasPermissions',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.hasMany(models.docDocumentsAccess, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'access',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.docPermissions, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'permissions',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.hasMany(models.docVersionsSocializations, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'socializations',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.finInvoices, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'invoices',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.finTransactions, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'transactions',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.prjProjectsHasAccounts, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'projectsHasAccounts',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.supTickets, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'tickets',
    //   onUpdate: 'SET NULL',
    //   onDelete: 'SET NULL',
    // });
    // this.hasMany(models.supTickets, {
    //   foreignKey: 'idAsignee',
    //   sourceKey: 'id',
    //   as: 'tickets',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.hasMany(models.usrAccesses, {
    //   foreignKey: 'accountId',
    //   sourceKey: 'id',
    //   as: 'accesses',
    //   onUpdate: 'RESTRICT',
    //   onDelete: 'RESTRICT',
    // });
    // this.hasMany(models.usrImages, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'images',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.hasMany(models.usrPreferences, {
    //   foreignKey: 'idAccount',
    //   sourceKey: 'id',
    //   as: 'preferences',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // this.hasMany(models.usrTokens, {
    //   foreignKey: 'accountId',
    //   sourceKey: 'id',
    //   as: 'tokens',
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });
    // // Bridges
    // this.belongsToMany(models.configEndpoints, {
    //   through: { model: models.configEndpointsHasPermissions },
    //   foreignKey: 'idAccount',
    //   otherKey: 'idEndpoint',
    //   as: 'endpoints',
    // });
    // this.belongsToMany(models.configRoles, {
    //   through: { model: models.configEndpointsHasPermissions },
    //   foreignKey: 'idAccount',
    //   otherKey: 'idRole',
    //   as: 'roles',
    // });
    // this.belongsToMany(models.configPages, {
    //   through: { model: models.configPagesHasPermissions },
    //   foreignKey: 'idAccount',
    //   otherKey: 'idPage',
    //   as: 'pages',
    // });
    // this.belongsToMany(models.configRoles, {
    //   through: { model: models.configPagesHasPermissions },
    //   foreignKey: 'idAccount',
    //   otherKey: 'idRole',
    //   as: 'roles',
    // });
    // this.belongsToMany(models.prjProjects, {
    //   through: { model: models.prjProjectsHasAccounts },
    //   foreignKey: 'idAccount',
    //   otherKey: 'idProject',
    //   as: 'projects',
    // });
    // this.belongsToMany(models.configRoles, {
    //   through: { model: models.prjProjectsHasAccounts },
    //   foreignKey: 'idAccount',
    //   otherKey: 'idRole',
    //   as: 'roles',
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
