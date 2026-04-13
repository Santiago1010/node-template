'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_job_levels',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each job level.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Unique business identifier for the job level (e.g. JL-JR, JL-SR, JL-DIR). Used across HR and compensation structures.',
        },
        level_order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'Numeric order representing hierarchy (e.g. 1 = lowest, higher numbers = more senior). Used for comparisons, promotions, and validations.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment:
            'Job level name (e.g. Junior, Senior, Director). Stored as JSON to support multilingual representations if needed.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional description of the level, including expectations, scope, and responsibilities.',
        },
        is_management_level: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates if this level is considered managerial (e.g. Manager, Director). Used for approvals and organizational rules.',
        },
        is_executive_level: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates if this level is executive (e.g. C-level). Useful for governance and compensation rules.',
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
        comment: 'Job levels definition.',
      }
    );

    await queryInterface.addIndex('hr_job_levels', ['code'], {
      unique: true,
      name: 'uq_hr_job_levels_code',
    });

    await queryInterface.addIndex('hr_job_levels', ['level_order'], {
      unique: true,
      name: 'uq_hr_job_levels_level_order',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_job_levels');
  },
};
