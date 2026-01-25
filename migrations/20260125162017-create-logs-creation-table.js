'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'logs_creation',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key to identify each creation log.',
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
            'Information about the user who created the record. This is stored as JSON in case the account and/or user is deleted.',
        },
        data: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Information about the created record. It is stored as JSON in case the record is later deleted.',
        },
        table_model: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Table name affects the name of its respective model.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was created. This is more useful for debugging purposes than for information.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores creation logs for certain tables.',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('logs_creation');
  },
};
