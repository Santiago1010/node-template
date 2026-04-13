'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_contracts',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each contract.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the contract (e.g. CT-2026-0001). Used in legal and HR processes.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee under this contract.',
        },
        legal_entity_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to core_legal_entities. Legal employer entity signing the contract.',
        },
        contract_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Type of contract (e.g. indefinite, fixed_term, contractor, internship). Should be standardized at application level or future catalog table.',
        },
        work_schedule_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Work schedule type (e.g. full_time, part_time, shift_based). Defines general working pattern.',
        },
        weekly_hours: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Number of working hours per week (e.g. 40.00). Optional depending on contract type.',
        },
        termination_reason: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Reason for contract termination (e.g. resignation, termination_with_cause). Stored as free text for flexibility; can be normalized later.',
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when the contract becomes effective.',
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Contract end date. NULL for indefinite contracts.',
        },
        probation_end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'End date of probation period, if applicable.',
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
        comment: 'Employee contracts.',
      }
    );

    await queryInterface.addIndex('hr_contracts', ['code'], {
      unique: true,
      name: 'uq_hr_contracts_code',
    });

    await queryInterface.addIndex('hr_contracts', ['employee_id'], {
      name: 'idx_hr_contracts_employee_id',
    });

    await queryInterface.addIndex('hr_contracts', ['legal_entity_id'], {
      name: 'idx_hr_contracts_legal_entity_id',
    });

    await queryInterface.addIndex('hr_contracts', ['start_date'], {
      name: 'idx_hr_contracts_start_date',
    });

    await queryInterface.addIndex('hr_contracts', ['end_date'], {
      name: 'idx_hr_contracts_end_date',
    });

    await queryInterface.addConstraint('hr_contracts', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_contracts_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_contracts', {
      fields: ['legal_entity_id'],
      type: 'foreign key',
      name: 'fk_hr_contracts_legal_entity',
      references: {
        table: 'core_legal_entities',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_contracts');
  },
};
