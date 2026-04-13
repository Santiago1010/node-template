'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_terminations',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each termination record.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee whose employment is being terminated.',
        },
        contract_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_contracts. Contract being terminated.',
        },
        approved_by_employee_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_employees. Person who approved the termination.',
        },
        termination_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Type of termination (e.g. resignation, dismissal, mutual_agreement, end_of_contract).',
        },
        termination_reason: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
          comment: 'Detailed reason for termination. Can include legal justification or context.',
        },
        is_voluntary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          comment: 'Indicates if termination was voluntary (1) or involuntary (0).',
        },
        has_legal_implications: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates if this termination has legal implications (e.g. litigation risk).',
        },
        termination_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Effective date when the employment ends.',
        },
        notice_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Date when termination notice was given. Important for legal compliance.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Creation timestamp of the termination record.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Employee termination records.',
      }
    );

    await queryInterface.addIndex('hr_terminations', ['employee_id'], {
      name: 'idx_hr_terminations_employee_id',
    });

    await queryInterface.addIndex('hr_terminations', ['contract_id'], {
      name: 'idx_hr_terminations_contract_id',
    });

    await queryInterface.addIndex('hr_terminations', ['termination_date'], {
      name: 'idx_hr_terminations_termination_date',
    });

    await queryInterface.addIndex('hr_terminations', ['approved_by_employee_id'], {
      name: 'idx_hr_terminations_approved_by_employee_id',
    });

    await queryInterface.addConstraint('hr_terminations', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_terminations_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_terminations', {
      fields: ['contract_id'],
      type: 'foreign key',
      name: 'fk_hr_terminations_contract',
      references: {
        table: 'hr_contracts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_terminations', {
      fields: ['approved_by_employee_id'],
      type: 'foreign key',
      name: 'fk_hr_terminations_approver',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_terminations');
  },
};
