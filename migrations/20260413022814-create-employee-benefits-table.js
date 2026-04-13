'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_benefits',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each assigned benefit.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee receiving the benefit.',
        },
        benefit_type_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_benefit_types. Type of benefit assigned.',
        },
        contract_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_contracts. Contract under which the benefit applies. NULL if employee-level.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to core_currencies. Required if value_type is monetary.',
        },
        value_type: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: null,
          comment:
            'Defines how the value is interpreted (e.g. fixed_amount, percentage). Optional depending on benefit.',
        },
        value_amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Amount or percentage value depending on value_type.',
        },
        effective_start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when the benefit becomes effective.',
        },
        effective_end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Date when the benefit ends. NULL means currently active.',
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
        collate: 'utf8mb4_general_ci',
        comment: 'Employee benefits assignments.',
      }
    );

    await queryInterface.addIndex('hr_employee_benefits', ['employee_id'], {
      name: 'idx_hr_employee_benefits_employee_id',
    });

    await queryInterface.addIndex('hr_employee_benefits', ['contract_id'], {
      name: 'idx_hr_employee_benefits_contract_id',
    });

    await queryInterface.addIndex('hr_employee_benefits', ['benefit_type_id'], {
      name: 'idx_hr_employee_benefits_benefit_type_id',
    });

    await queryInterface.addIndex('hr_employee_benefits', ['currency_id'], {
      name: 'idx_hr_employee_benefits_currency_id',
    });

    await queryInterface.addConstraint('hr_employee_benefits', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_employee_benefits_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_benefits', {
      fields: ['contract_id'],
      type: 'foreign key',
      name: 'fk_hr_employee_benefits_contract',
      references: {
        table: 'hr_contracts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_benefits', {
      fields: ['benefit_type_id'],
      type: 'foreign key',
      name: 'fk_hr_employee_benefits_type',
      references: {
        table: 'hr_benefit_types',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_benefits', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_hr_employee_benefits_currency',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_benefits');
  },
};
