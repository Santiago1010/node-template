'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_users',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier of each client.',
        },
        first_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'First name of the user/customer.',
        },
        second_name: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Second name of the user/client (if applicable).',
        },
        first_last_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'First surname of the user/customer.',
        },
        second_last_name: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Second surname of the user/client (if applicable).',
        },
        created_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created in the table.',
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was last modified.',
        },
        deleted_at: {
          type: 'TIMESTAMP',
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
        comment: 'Basic information about users/employees.',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_users');
  },
};
