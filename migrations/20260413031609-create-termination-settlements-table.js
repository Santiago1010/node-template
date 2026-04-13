'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_termination_settlements',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each settlement record.',
        },
        termination_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          unique: true,
          comment: 'FK to hr_terminations. Termination event associated with this settlement.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Redundant reference for easier querying and validation.',
        },
        contract_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_contracts. Contract being settled.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_currencies. Currency in which the settlement is calculated.',
        },
        approved_by_employee_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_employees. Person who approved the settlement.',
        },
        salary_pending: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Pending salary to be paid up to termination date.',
        },
        unused_vacation: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Value of unused vacation days to be paid.',
        },
        severance_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Severance payment amount (if applicable).',
        },
        bonus_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Any additional bonus or compensation included in the settlement.',
        },
        deductions_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Total deductions applied (e.g. loans, advances, penalties).',
        },
        total_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Final net amount to be paid to the employee after all calculations.',
        },
        calculated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Timestamp when the settlement was calculated.',
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
        collate: 'utf8mb4_general_ci',
        comment: 'Termination settlements records.',
      }
    );

    await queryInterface.addIndex('hr_termination_settlements', ['termination_id'], {
      name: 'uq_hr_termination_settlements_termination_id',
      unique: true,
    });

    await queryInterface.addIndex('hr_termination_settlements', ['employee_id'], {
      name: 'idx_hr_termination_settlements_employee_id',
    });

    await queryInterface.addIndex('hr_termination_settlements', ['contract_id'], {
      name: 'idx_hr_termination_settlements_contract_id',
    });

    await queryInterface.addIndex('hr_termination_settlements', ['currency_id'], {
      name: 'idx_hr_termination_settlements_currency_id',
    });

    await queryInterface.addIndex('hr_termination_settlements', ['approved_by_employee_id'], {
      name: 'idx_hr_termination_settlements_approved_by_employee_id',
    });

    await queryInterface.addConstraint('hr_termination_settlements', {
      fields: ['termination_id'],
      type: 'foreign key',
      name: 'fk_hr_termination_settlements_termination',
      references: {
        table: 'hr_terminations',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_termination_settlements', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_termination_settlements_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_termination_settlements', {
      fields: ['contract_id'],
      type: 'foreign key',
      name: 'fk_hr_termination_settlements_contract',
      references: {
        table: 'hr_contracts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_termination_settlements', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_hr_termination_settlements_currency',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_termination_settlements', {
      fields: ['approved_by_employee_id'],
      type: 'foreign key',
      name: 'fk_hr_termination_settlements_approver',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_termination_settlements');
  },
};
