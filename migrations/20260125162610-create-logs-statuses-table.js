'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'logs_statuses',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each log.',
        },
        row_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the affected record.',
        },
        responsible: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Unique identifier for each record.',
        },
        table_model: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the affected table with its respective model name.',
        },
        type: {
          type: Sequelize.ENUM('reactivation', 'deactivation'),
          allowNull: false,
          comment: 'Type of operation: Whether the record was deactivated or reactivated.',
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time the status was changed.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'State change log (soft delete).',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('logs_statuses');
  },
};
