'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_leaves',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each leave record.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee requesting or taking the leave.',
        },
        leave_type_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_leave_types. Type of leave being requested.',
        },
        approved_by_employee_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_employees. Manager or approver of the leave.',
        },
        status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending',
          comment: 'Current status of the leave request.',
        },
        rejection_reason: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
          comment: 'Reason for rejection if applicable.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional notes or justification for the leave.',
        },
        total_days: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          comment: 'Total number of leave days. Can include fractions (e.g. 0.5 for half-day).',
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Start date of the leave period.',
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'End date of the leave period.',
        },
        approved_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Timestamp when the leave was approved.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Creation timestamp.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Last update timestamp.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_0900_ai_ci',
        comment: 'Employee leave requests and records.',
      }
    );

    await queryInterface.addIndex('hr_employee_leaves', ['employee_id'], {
      name: 'idx_hr_employee_leaves_employee_id',
    });

    await queryInterface.addIndex('hr_employee_leaves', ['leave_type_id'], {
      name: 'idx_hr_employee_leaves_leave_type_id',
    });

    await queryInterface.addIndex('hr_employee_leaves', ['status'], {
      name: 'idx_hr_employee_leaves_status',
    });

    await queryInterface.addIndex('hr_employee_leaves', ['start_date', 'end_date'], {
      name: 'idx_hr_employee_leaves_dates',
    });

    await queryInterface.addIndex('hr_employee_leaves', ['approved_by_employee_id'], {
      name: 'idx_hr_employee_leaves_approved_by_employee_id',
    });

    await queryInterface.addConstraint('hr_employee_leaves', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_leaves_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_leaves', {
      fields: ['leave_type_id'],
      type: 'foreign key',
      name: 'fk_hr_leaves_type',
      references: {
        table: 'hr_leave_types',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_leaves', {
      fields: ['approved_by_employee_id'],
      type: 'foreign key',
      name: 'fk_hr_leaves_approver',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_leaves');
  },
};
