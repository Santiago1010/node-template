'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_loans',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each employee loan.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Unique business identifier for the loan (e.g. LOAN-2026-0001). Used for tracking and reconciliation.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee receiving the loan.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_currencies. Currency of the loan.',
        },
        contract_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_contracts. Contract associated with the loan. NULL if not tied to a specific contract.',
        },
        status: {
          type: Sequelize.ENUM('active', 'closed', 'defaulted', 'cancelled'),
          allowNull: false,
          defaultValue: 'active',
          comment: 'Current state of the loan lifecycle.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional description or purpose of the loan (e.g. “medical advance”).',
        },
        principal_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Total loan amount granted to the employee (e.g. 1000.00).',
        },
        interest_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Optional interest rate percentage (e.g. 5.00 for 5%). NULL if interest-free.',
        },
        total_installments: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Total number of installments agreed for repayment.',
        },
        installment_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Amount to be paid per installment.',
        },
        outstanding_balance: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Remaining balance of the loan. Must be updated as payments are made.',
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when the loan becomes effective and repayment starts.',
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Expected end date of the loan based on schedule.',
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
        comment: 'Employee loans tracking.',
      }
    );

    await queryInterface.addIndex('hr_employee_loans', ['CODE'], {
      unique: true,
      name: 'uq_hr_employee_loans_code',
    });

    await queryInterface.addIndex('hr_employee_loans', ['employee_id'], {
      name: 'idx_hr_employee_loans_employee_id',
    });

    await queryInterface.addIndex('hr_employee_loans', ['contract_id'], {
      name: 'idx_hr_employee_loans_contract_id',
    });

    await queryInterface.addIndex('hr_employee_loans', ['currency_id'], {
      name: 'idx_hr_employee_loans_currency_id',
    });

    await queryInterface.addIndex('hr_employee_loans', ['STATUS'], {
      name: 'idx_hr_employee_loans_status',
    });

    await queryInterface.addConstraint('hr_employee_loans', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_loans_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_loans', {
      fields: ['contract_id'],
      type: 'foreign key',
      name: 'fk_hr_loans_contract',
      references: {
        table: 'hr_contracts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_loans', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_hr_loans_currency',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_loans');
  },
};
