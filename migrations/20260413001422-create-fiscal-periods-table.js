'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_fiscal_periods',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each fiscal period.',
        },
        slug: {
          type: Sequelize.STRING(30),
          allowNull: false,
          unique: true,
          comment:
            'Stable internal identifier for the period (e.g. 2025-01, 2025-Q1, 2025). Used in code and integrations.',
        },
        closed_by_account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to usr_accounts. Account that executed the period closing.',
        },
        parent_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to acct_fiscal_periods. Links a sub-period (e.g. month) to its parent (e.g. fiscal year).',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the period in multiple languages (e.g. "January 2025", "Q1 2025").',
        },
        type: {
          type: Sequelize.ENUM('year', 'quarter', 'month', 'custom'),
          allowNull: false,
          defaultValue: 'month',
          comment: 'Granularity of the period. Custom allows non-standard intervals for specific projects.',
        },
        is_closed: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          comment:
            'Indicates whether the period is closed. Closed periods reject new journal entries. Unlike deleted_at, a closed period is a permanent business state — it cannot be reopened under normal circumstances and does not imply the record is inactive.',
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'First day of the fiscal period, inclusive.',
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Last day of the fiscal period, inclusive.',
        },
        closed_at: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Date and time when the period was officially closed. Null if still open.',
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
        comment: 'Fiscal periods for grouping and closing accounting entries',
      }
    );

    await queryInterface.addIndex('acct_fiscal_periods', ['slug'], {
      name: 'uq_acct_slug',
      unique: true,
    });

    await queryInterface.addIndex('acct_fiscal_periods', ['closed_by_account_id'], {
      name: 'idx_acct_closed_by_account_id',
    });

    await queryInterface.addIndex('acct_fiscal_periods', ['parent_id'], {
      name: 'idx_acct_parent_id',
    });

    await queryInterface.addConstraint('acct_fiscal_periods', {
      fields: ['closed_by_account_id'],
      type: 'foreign key',
      name: 'fk_acct_closed_by_account_id',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_fiscal_periods', {
      fields: ['parent_id'],
      type: 'foreign key',
      name: 'fk_acct_parent_id',
      references: {
        table: 'acct_fiscal_periods',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_fiscal_periods');
  },
};
