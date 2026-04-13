'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_objective_progress',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each progress record.',
        },
        objective_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employee_objectives. Objective being tracked.',
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional note explaining the progress update.',
        },
        progress_value: {
          type: Sequelize.DECIMAL(15, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Measured value at this point (e.g. sales achieved, % progress).',
        },
        progress_percentage: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Progress expressed as percentage (0–100).',
        },
        progress_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date of the progress measurement.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the progress record was created.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Progress tracking for employee objectives.',
      }
    );

    await queryInterface.addIndex('hr_employee_objective_progress', ['objective_id', 'progress_date'], {
      unique: true,
      name: 'uq_hr_employee_objective_progress_objective_date',
    });

    await queryInterface.addIndex('hr_employee_objective_progress', ['objective_id'], {
      name: 'idx_hr_employee_objective_progress_objective_id',
    });

    await queryInterface.addConstraint('hr_employee_objective_progress', {
      fields: ['objective_id'],
      type: 'foreign key',
      name: 'fk_hr_emp_obj_progress_objective',
      references: {
        table: 'hr_employee_objectives',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_objective_progress');
  },
};
