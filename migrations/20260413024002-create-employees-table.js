'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employees',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each employee record.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Unique business identifier for the employee (e.g. EMP-000123). Used across HR processes and documents.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to usr_accounts. Every employee must have platform access.',
        },
        counterparty_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to acct_counterparties. Represents the employee as a financial entity for accounting purposes.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates if the employee is currently active in the organization. 1 = active, 0 = inactive. Controlled by HR lifecycle events.',
        },
        hire_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment:
            'Date when the employee started their first employment relationship with the company. Does not change across rehires unless business rules define otherwise.',
        },
        termination_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Date when the employee definitively ended employment. NULL if still active.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the employee record was created.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the employee record was last updated.',
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Soft delete timestamp. Used when the record should be hidden but preserved for audit purposes.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_0900_ai_ci',
        comment: 'Employee master records.',
      }
    );

    await queryInterface.addIndex('hr_employees', ['code'], {
      unique: true,
      name: 'uq_hr_employees_code',
    });

    await queryInterface.addIndex('hr_employees', ['account_id'], {
      unique: true,
      name: 'uq_hr_employees_account_id',
    });

    await queryInterface.addIndex('hr_employees', ['counterparty_id'], {
      unique: true,
      name: 'uq_hr_employees_counterparty_id',
    });

    await queryInterface.addConstraint('hr_employees', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_hr_employees_account',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employees', {
      fields: ['counterparty_id'],
      type: 'foreign key',
      name: 'fk_hr_employees_counterparty',
      references: {
        table: 'acct_counterparties',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employees');
  },
};
