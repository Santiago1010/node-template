'use strict';

const { Model, DataTypes } = require('sequelize');

// Basic information about users/employees.

const TABLE_NAME = 'usr_users';
const MODEL_NAME = 'usrUsers';

const Schema = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    unique: 'PRIMARY',
    comment: 'Unique identifier of each client.',
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'First name of the user/customer.',
    field: 'first_name',
  },
  secondName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
    comment: 'Second name of the user/client (if applicable).',
    field: 'second_name',
  },
  firstLastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'First surname of the user/customer.',
    field: 'first_last_name',
  },
  secondLastName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
    comment: 'Second surname of the user/client (if applicable).',
    field: 'second_last_name',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date and time when the record was created in the table.	',
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
    this.hasMany(models.usrAccounts, {
      foreignKey: 'userId',
      sourceKey: 'id',
      as: 'accounts',
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
    });
    this.hasMany(models.usrUsersDetails, {
      foreignKey: 'userId',
      sourceKey: 'id',
      as: 'details',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

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
