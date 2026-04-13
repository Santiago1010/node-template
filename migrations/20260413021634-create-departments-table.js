'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_departments',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each department.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the department (e.g. DEPT-FIN-001). Used across HR and reporting.',
        },
        branch_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to core_branches. Branch where this department operates.',
        },
        parent_department_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'Self-referencing FK to hr_departments. Allows hierarchical structures (e.g. Finance > Accounting). NULL if top-level department.',
        },
        manager_employee_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to hr_employees. Employee responsible for managing this department. Optional because assignment may change over time.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Department name. Stored as JSON to support multilingual representations if needed.',
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
        comment: 'Departments definition.',
      }
    );

    await queryInterface.addIndex('hr_departments', ['code'], {
      unique: true,
      name: 'uq_hr_departments_code',
    });

    await queryInterface.addIndex('hr_departments', ['branch_id'], {
      name: 'idx_hr_departments_branch_id',
    });

    await queryInterface.addIndex('hr_departments', ['parent_department_id'], {
      name: 'idx_hr_departments_parent_department_id',
    });

    await queryInterface.addIndex('hr_departments', ['manager_employee_id'], {
      name: 'idx_hr_departments_manager_employee_id',
    });

    await queryInterface.addConstraint('hr_departments', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fk_hr_departments_branch',
      references: {
        table: 'core_branches',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_departments', {
      fields: ['manager_employee_id'],
      type: 'foreign key',
      name: 'fk_hr_departments_manager',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_departments', {
      fields: ['parent_department_id'],
      type: 'foreign key',
      name: 'fk_hr_departments_parent',
      references: {
        table: 'hr_departments',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_departments');
  },
};
