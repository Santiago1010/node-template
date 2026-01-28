'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'logs_deletion',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key to identify each deletion log.',
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
            'Information about the person who deleted the record. This is stored in JSON format in case the person responsible is also deleted.',
        },
        old_data: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Data from the record that was deleted. In JSON format for easier reading.',
        },
        table_model: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the affected table with the name of its respective model.',
        },
        justification: {
          type: Sequelize.TEXT('long'),
          allowNull: true,
          comment: 'Detailed justification for why the record was permanently deleted.',
        },
        deleted_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Exact date and time when the record was deleted.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores information that has been deleted.',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('logs_deletion');
  },
};
