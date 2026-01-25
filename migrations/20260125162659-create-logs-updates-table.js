'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'logs_updates',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key to identify each update log.',
        },
        row_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the affected record.',
        },
        responsible: {
          type: Sequelize.JSON,
          allowNull: false,
          comment:
            'Data of the person responsible for updating the registry. In JSON format in case the user or account is subsequently deleted.',
        },
        old_data: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Old information of the record in JSON format or similar.',
        },
        new_data: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'New updated information of the record in JSON format or similar.',
        },
        table_model: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the affected table with the name of its respective model.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was updated. This is more useful for debugging purposes than for information.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores important updated information.',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('logs_updates');
  },
};
