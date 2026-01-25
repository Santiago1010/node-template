'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_scopes',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each scope.',
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Unique scope name (in snake_case and separated by a colon).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Description of the permissions that the scope has.',
        },
        is_selectable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates whether the scope is selectable or deselectable to be configured for specific roles and/or accounts. If false, it should not be displayed to the public.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created.',
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
        comment: 'System-wide scopes.',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_scopes');
  },
};
