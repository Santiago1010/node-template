'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_review_assignments',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each reviewer assignment.',
        },
        cycle_employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_cycle_employees. Target employee within a specific cycle.',
        },
        reviewer_employee_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_employees. Employee who performs the evaluation. Null if external reviewer.',
        },
        reviewer_type: {
          type: Sequelize.ENUM('self', 'manager', 'peer', 'upward', 'external'),
          allowNull: false,
          comment:
            'Defines the role of the reviewer. self: employee evaluates self, manager: direct supervisor, peer: colleague, upward: subordinate evaluates manager, external: outside organization.',
        },
        external_reviewer_name: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
          comment: 'Name of the external reviewer if reviewer_type = external.',
        },
        external_reviewer_email: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
          comment: 'Email of the external reviewer (used for notifications and tracking).',
        },
        status: {
          type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending',
          comment:
            'Evaluation assignment status. pending: not started, in_progress: ongoing, completed: submitted, cancelled: no longer required.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. weighting, anonymity flags, special instructions).',
        },
        assigned_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the reviewer was assigned.',
        },
        due_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional deadline for this specific reviewer.',
        },
        completed_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Timestamp when the reviewer submitted the evaluation.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the assignment record was created.',
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
        collate: 'utf8mb4_general_ci',
        comment: 'Performance review assignments to reviewers (internal or external).',
      }
    );

    await queryInterface.addIndex(
      'hr_performance_review_assignments',
      ['cycle_employee_id', 'reviewer_employee_id', 'reviewer_type'],
      {
        unique: true,
        name: 'uq_hr_performance_review_assignments_reviewer_assignment',
      }
    );

    await queryInterface.addIndex('hr_performance_review_assignments', ['cycle_employee_id'], {
      name: 'idx_hr_performance_review_assignments_cycle_employee_id',
    });

    await queryInterface.addIndex('hr_performance_review_assignments', ['reviewer_employee_id'], {
      name: 'idx_hr_performance_review_assignments_reviewer_employee_id',
    });

    await queryInterface.addConstraint('hr_performance_review_assignments', {
      fields: ['cycle_employee_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_assignments_cycle_employee',
      references: {
        table: 'hr_performance_cycle_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_assignments', {
      fields: ['reviewer_employee_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_assignments_reviewer',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_review_assignments');
  },
};
