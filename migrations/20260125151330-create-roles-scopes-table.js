'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_roles_has_scopes',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for the relationship between role and scope.',
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Role ID.',
        },
        scope_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Scope ID.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created in the table.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was last modified.',
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment:
            'Date and time when the record was deactivated. If the value is null, it means the record is still active; otherwise, it indicates that the record has been deactivated (known as soft deletion), without removing the information from the table.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Scopes that each role has.',
      }
    );

    await queryInterface.addIndex('config_roles_has_scopes', ['role_id'], {
      name: 'role',
    });

    await queryInterface.addIndex('config_roles_has_scopes', ['scope_id'], {
      name: 'scope_id',
    });

    await queryInterface.addConstraint('config_roles_has_scopes', {
      fields: ['role_id'],
      type: 'foreign key',
      name: 'config_roles_has_scopes_ibfk_1',
      references: {
        table: 'config_roles',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });

    await queryInterface.addConstraint('config_roles_has_scopes', {
      fields: ['scope_id'],
      type: 'foreign key',
      name: 'config_roles_has_scopes_ibfk_2',
      references: {
        table: 'config_scopes',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_roles_has_scopes');
  },
};
