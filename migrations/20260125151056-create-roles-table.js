'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_roles',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each rol.',
        },
        security_level_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the security level that the role can access.',
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Role name.',
        },
        target: {
          type: Sequelize.ENUM('employee', 'customer'),
          allowNull: false,
          defaultValue: 'customer',
          comment: 'Defines who the profiles are available for (linked to the tables that store user information).',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the role is the default. There can only be one per target.',
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
        comment: 'Table that stores roles and their availability.',
      }
    );

    await queryInterface.addIndex('config_roles', ['security_level_id'], {
      name: 'security_level',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_roles');
  },
};
