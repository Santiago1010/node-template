'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_assignments',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each assignment record.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee to whom this assignment belongs.',
        },
        legal_entity_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to core_legal_entities. Legal employer entity for this assignment.',
        },
        branch_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to core_branches. Physical or operational location where the employee works.',
        },
        department_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_departments. Department within the branch.',
        },
        position_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_positions. Role performed by the employee.',
        },
        job_level_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_job_levels. Seniority level associated with the position.',
        },
        manager_employee_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to hr_employees. Direct manager of the employee during this assignment. Nullable for top-level roles.',
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates if this is the primary assignment. Useful if multiple parallel assignments are allowed in the future.',
        },
        effective_start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when this assignment becomes effective. Defines the start of this organizational state.',
        },
        effective_end_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Date when this assignment ends. NULL means it is the current active assignment.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the assignment record was created.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Employee organizational assignments tracking history and current state.',
      }
    );

    await queryInterface.addIndex('hr_employee_assignments', ['employee_id'], {
      name: 'idx_hr_employee_assignments_employee_id',
    });

    await queryInterface.addIndex('hr_employee_assignments', ['legal_entity_id'], {
      name: 'idx_hr_employee_assignments_legal_entity_id',
    });

    await queryInterface.addIndex('hr_employee_assignments', ['branch_id'], {
      name: 'idx_hr_employee_assignments_branch_id',
    });

    await queryInterface.addIndex('hr_employee_assignments', ['department_id'], {
      name: 'idx_hr_employee_assignments_department_id',
    });

    await queryInterface.addIndex('hr_employee_assignments', ['position_id'], {
      name: 'idx_hr_employee_assignments_position_id',
    });

    await queryInterface.addIndex('hr_employee_assignments', ['job_level_id'], {
      name: 'idx_hr_employee_assignments_job_level_id',
    });

    await queryInterface.addIndex('hr_employee_assignments', ['manager_employee_id'], {
      name: 'idx_hr_employee_assignments_manager_employee_id',
    });

    await queryInterface.addIndex('hr_employee_assignments', ['effective_start_date', 'effective_end_date'], {
      name: 'idx_hr_employee_assignments_effective_dates',
    });

    await queryInterface.addConstraint('hr_employee_assignments', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_assignments_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_assignments', {
      fields: ['legal_entity_id'],
      type: 'foreign key',
      name: 'fk_hr_assignments_legal_entity',
      references: {
        table: 'core_legal_entities',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_assignments', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fk_hr_assignments_branch',
      references: {
        table: 'core_branches',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_assignments', {
      fields: ['department_id'],
      type: 'foreign key',
      name: 'fk_hr_assignments_department',
      references: {
        table: 'hr_departments',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_assignments', {
      fields: ['position_id'],
      type: 'foreign key',
      name: 'fk_hr_assignments_position',
      references: {
        table: 'hr_positions',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_assignments', {
      fields: ['job_level_id'],
      type: 'foreign key',
      name: 'fk_hr_assignments_job_level',
      references: {
        table: 'hr_job_levels',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_assignments', {
      fields: ['manager_employee_id'],
      type: 'foreign key',
      name: 'fk_hr_assignments_manager',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_assignments');
  },
};
