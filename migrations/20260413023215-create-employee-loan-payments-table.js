'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_loan_payments',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each loan payment.',
        },
        loan_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employee_loans. Loan to which this payment is applied.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Redundant reference for easier querying and validation.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_currencies. Currency of the payment.',
        },
        payment_method: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Method of payment (e.g. payroll_deduction, cash, bank_transfer).',
        },
        reference: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment: 'Optional external reference (e.g. payroll ID, transaction ID).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional description or notes about the payment.',
        },
        amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Amount paid toward the loan.',
        },
        payment_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when the payment was made or applied.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the payment record was created.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_0900_ai_ci',
        comment: 'Payments made toward employee loans.',
      }
    );

    await queryInterface.addIndex('hr_employee_loan_payments', ['loan_id'], {
      name: 'idx_hr_employee_loan_payments_loan_id',
    });

    await queryInterface.addIndex('hr_employee_loan_payments', ['employee_id'], {
      name: 'idx_hr_employee_loan_payments_employee_id',
    });

    await queryInterface.addIndex('hr_employee_loan_payments', ['currency_id'], {
      name: 'idx_hr_employee_loan_payments_currency_id',
    });

    await queryInterface.addIndex('hr_employee_loan_payments', ['payment_date'], {
      name: 'idx_hr_employee_loan_payments_payment_date',
    });

    await queryInterface.addConstraint('hr_employee_loan_payments', {
      fields: ['loan_id'],
      type: 'foreign key',
      name: 'fk_hr_loan_payments_loan',
      references: {
        table: 'hr_employee_loans',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_loan_payments', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_loan_payments_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_loan_payments', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_hr_loan_payments_currency',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_loan_payments');
  },
};
