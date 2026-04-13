'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_compensation_items',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each compensation item.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee receiving this compensation.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_currencies. Currency in which the amount is defined.',
        },
        contract_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_contracts. Contract under which this compensation applies. NULL if not contract-specific.',
        },
        compensation_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Type of compensation (e.g. bonus, commission, allowance, overtime). Defines business meaning.',
        },
        amount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Amount of the compensation item. Positive value representing payment.',
        },
        is_recurring: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates if the compensation is recurring (1) or one-time (0).',
        },
        recurrence_frequency: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: null,
          comment: 'Frequency of recurrence (e.g. monthly, quarterly). Required if is_recurring = 1.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional explanation of the compensation (e.g. “Q1 performance bonus”).',
        },
        effective_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when this compensation becomes effective or is paid.',
        },
        reference_period_start: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Start date of the period this compensation relates to (e.g. sales month).',
        },
        reference_period_end: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'End date of the period this compensation relates to.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the compensation record was created.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Compensation items for employees.',
      }
    );

    await queryInterface.addIndex('hr_compensation_items', ['employee_id'], {
      name: 'idx_hr_compensation_items_employee_id',
    });

    await queryInterface.addIndex('hr_compensation_items', ['contract_id'], {
      name: 'idx_hr_compensation_items_contract_id',
    });

    await queryInterface.addIndex('hr_compensation_items', ['currency_id'], {
      name: 'idx_hr_compensation_items_currency_id',
    });

    await queryInterface.addIndex('hr_compensation_items', ['effective_date'], {
      name: 'idx_hr_compensation_items_effective_date',
    });

    await queryInterface.addConstraint('hr_compensation_items', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_comp_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_compensation_items', {
      fields: ['contract_id'],
      type: 'foreign key',
      name: 'fk_hr_comp_contract',
      references: {
        table: 'hr_contracts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_compensation_items', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_hr_comp_currency',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_compensation_items');
  },
};
