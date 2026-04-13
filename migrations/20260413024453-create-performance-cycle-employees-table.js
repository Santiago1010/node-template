'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_cycle_employees',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each employee-cycle assignment.',
        },
        cycle_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_review_cycles. Defines the cycle the employee participates in.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee assigned to the cycle.',
        },
        status: {
          type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'excluded'),
          allowNull: false,
          defaultValue: 'pending',
          comment:
            'Participation status. pending: not started, in_progress: ongoing, completed: finished, excluded: intentionally removed.',
        },
        eligibility_reason: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
          comment:
            'Optional explanation of why the employee is included or excluded (e.g. probation, contractor, leave).',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. overrides, special rules, flags for calibration groups).',
        },
        included_at: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when the employee was included in the cycle.',
        },
        excluded_at: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Date when the employee was excluded from the cycle, if applicable.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the assignment was created.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the assignment was last modified.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_0900_ai_ci',
        comment: 'Mapping of employees to performance review cycles.',
      }
    );

    await queryInterface.addIndex('hr_performance_cycle_employees', ['cycle_id', 'employee_id'], {
      unique: true,
      name: 'uq_hr_performance_cycle_employees_cycle_employee',
    });

    await queryInterface.addIndex('hr_performance_cycle_employees', ['cycle_id'], {
      name: 'idx_hr_performance_cycle_employees_cycle_id',
    });

    await queryInterface.addIndex('hr_performance_cycle_employees', ['employee_id'], {
      name: 'idx_hr_performance_cycle_employees_employee_id',
    });

    await queryInterface.addConstraint('hr_performance_cycle_employees', {
      fields: ['cycle_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_cycle_employees_cycle',
      references: {
        table: 'hr_performance_review_cycles',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_cycle_employees', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_cycle_employees_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_cycle_employees');
  },
};
