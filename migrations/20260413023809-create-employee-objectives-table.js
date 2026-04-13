'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_objectives',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each employee objective.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the objective (e.g. OBJ-2026-Q1-001).',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee responsible for this objective.',
        },
        cycle_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_performance_review_cycles. Optional link to a performance cycle.',
        },
        title: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Objective title in multiple languages.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Detailed explanation of the objective and expected outcome.',
        },
        objective_type: {
          type: Sequelize.ENUM('okr', 'kpi', 'personal', 'development'),
          allowNull: false,
          comment: 'Type of objective (OKR, KPI, personal development, etc.).',
        },
        status: {
          type: Sequelize.ENUM('draft', 'active', 'in_progress', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'draft',
          comment: 'Lifecycle status of the objective.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether the objective is active.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. measurement method, units, dependencies).',
        },
        target_value: {
          type: Sequelize.DECIMAL(15, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Target numeric value (e.g. 100000 sales, 20% growth).',
        },
        current_value: {
          type: Sequelize.DECIMAL(15, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Current achieved value (snapshot, optional).',
        },
        weight: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Relative importance of this objective in evaluations.',
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Start date of the objective.',
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'End date of the objective.',
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
        collate: 'utf8mb4_0900_ai_ci',
        comment: 'Employee objectives for performance management.',
      }
    );

    await queryInterface.addIndex('hr_employee_objectives', ['code'], {
      unique: true,
      name: 'uq_hr_employee_objectives_code',
    });

    await queryInterface.addIndex('hr_employee_objectives', ['employee_id'], {
      name: 'idx_hr_employee_objectives_employee_id',
    });

    await queryInterface.addIndex('hr_employee_objectives', ['cycle_id'], {
      name: 'idx_hr_employee_objectives_cycle_id',
    });

    await queryInterface.addConstraint('hr_employee_objectives', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_emp_objectives_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_objectives', {
      fields: ['cycle_id'],
      type: 'foreign key',
      name: 'fk_hr_emp_objectives_cycle',
      references: {
        table: 'hr_performance_review_cycles',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_objectives');
  },
};
