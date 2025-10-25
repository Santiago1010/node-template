'use strict';

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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      table: 'usr_users',
      column: 'id',
      model: 'usrUsers',
      key: 'id',
    },
    comment: 'User/customer ID associated with the account.',
    field: 'user_id',
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
  dialCodeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'Mobile number code ID. Cannot be null if a cell phone number exists.',
    field: 'dial_code_id',
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
  password: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: "Hash of the user's access password. It is encrypted for enhanced security of the user's information.",
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
    this.belongsTo(models.usrUsers, {
      foreignKey: 'userId',
      targetKey: 'id',
      as: 'user',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.belongsTo(models.configRoles, {
      foreignKey: 'rolId',
      targetKey: 'id',
      as: 'rol',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });

    // References
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
    this.hasMany(models.usrAccesses, {
      foreignKey: 'accountId',
      sourceKey: 'id',
      as: 'accesses',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.hasMany(models.usrAccountsHasScopes, {
      foreignKey: 'accountId',
      sourceKey: 'id',
      as: 'accountsHasScopes',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.hasMany(models.usrCredentials, {
      foreignKey: 'accountId',
      sourceKey: 'id',
      as: 'credentials',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.hasMany(models.usrDevices, {
      foreignKey: 'accountId',
      sourceKey: 'id',
      as: 'devices',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.hasMany(models.usrImages, {
      foreignKey: 'accountId',
      sourceKey: 'id',
      as: 'images',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.hasMany(models.usrPreferences, {
      foreignKey: 'accountId',
      sourceKey: 'id',
      as: 'preferences',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    this.hasMany(models.usrTokens, {
      foreignKey: 'accountId',
      sourceKey: 'id',
      as: 'tokens',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Bridges
    this.belongsToMany(models.configScopes, {
      through: { model: models.usrAccountsHasScopes },
      foreignKey: 'accountId',
      otherKey: 'scopeId',
      as: 'scopes',
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
