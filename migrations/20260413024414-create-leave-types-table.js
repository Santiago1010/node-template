'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_leave_types',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each leave type.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier (e.g. LEAVE-VAC, LEAVE-SICK).',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to core_countries. Allows country-specific leave definitions. NULL = global.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Leave type name (e.g. Vacation, Sick Leave). Supports multiple languages.',
        },
        is_paid: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates if the leave is paid (1) or unpaid (0).',
        },
        requires_approval: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates if this leave type requires approval workflow.',
        },
        affects_payroll: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates if this leave impacts payroll calculations.',
        },
        max_days_per_year: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Maximum allowed days per year for this leave type. NULL if unlimited or policy-based.',
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
        comment: 'Leave types catalog.',
      }
    );

    await queryInterface.addIndex('hr_leave_types', ['code'], {
      unique: true,
      name: 'uq_hr_leave_types_code',
    });

    await queryInterface.addIndex('hr_leave_types', ['country_id'], {
      name: 'idx_hr_leave_types_country_id',
    });

    await queryInterface.addConstraint('hr_leave_types', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'fk_hr_leave_types_country',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_leave_types');
  },
};
