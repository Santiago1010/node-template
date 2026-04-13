'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_salary_history',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each salary record.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee whose salary is being recorded.',
        },
        contract_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_contracts. Contract under which this salary applies.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_currencies. Currency in which the salary is defined.',
        },
        base_salary: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment:
            'Base salary amount for the employee (e.g. 2500.00). Does not include bonuses or variable compensation.',
        },
        pay_frequency: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Frequency of payment (e.g. monthly, biweekly, weekly). Defines how salary is interpreted.',
        },
        change_reason: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Reason for salary change (e.g. annual_raise, promotion, adjustment). Optional but useful for audit.',
        },
        effective_start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when this salary becomes effective.',
        },
        effective_end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Date when this salary stops being effective. NULL means current salary.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the salary record was created.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Salary history records for employees.',
      }
    );

    await queryInterface.addIndex('hr_salary_history', ['employee_id'], {
      name: 'idx_hr_salary_employee_id',
    });

    await queryInterface.addIndex('hr_salary_history', ['contract_id'], {
      name: 'idx_hr_salary_contract_id',
    });

    await queryInterface.addIndex('hr_salary_history', ['currency_id'], {
      name: 'idx_hr_salary_currency_id',
    });

    await queryInterface.addIndex('hr_salary_history', ['effective_start_date', 'effective_end_date'], {
      name: 'idx_hr_salary_effective_dates',
    });

    await queryInterface.addConstraint('hr_salary_history', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_salary_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_salary_history', {
      fields: ['contract_id'],
      type: 'foreign key',
      name: 'fk_hr_salary_contract',
      references: {
        table: 'hr_contracts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_salary_history', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_hr_salary_currency',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_salary_history');
  },
};
