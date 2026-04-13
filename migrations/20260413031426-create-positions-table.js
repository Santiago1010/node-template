'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_positions',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each position.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'Unique business identifier for the position (e.g. POS-BACKEND-001). Used across HR processes.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Position name. Stored as JSON to support multilingual representations if needed.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment:
            'Detailed description of the role, responsibilities, and expectations. Optional but useful for recruiting and HR processes.',
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
        comment: 'HR positions table.',
      }
    );

    await queryInterface.addIndex('hr_positions', ['code'], {
      name: 'uq_hr_code',
      unique: true,
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_positions');
  },
};
