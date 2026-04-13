'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_journal_entries',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment:
            'Unique identifier for each journal entry, used to group related journal entry lines and ensure traceability of accounting events.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'References the currency in which the journal entry is recorded, enabling multi-currency accounting support.',
        },
        fiscal_period_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'References the fiscal period associated with this journal entry.',
        },
        reversal_of_entry_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'Self-referencing foreign key pointing to the original journal entry being reversed, used to maintain an immutable audit trail instead of modifying existing records.',
        },
        is_adjustment: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether the entry is an adjustment (e.g., accruals, corrections) rather than a standard business transaction, useful for reporting and audit classification.',
        },
        status: {
          type: Sequelize.ENUM('draft', 'posted', 'reversed'),
          allowNull: false,
          defaultValue: 'draft',
          comment:
            "Indicates the lifecycle state of the journal entry; only entries in 'posted' status impact financial balances, while 'draft' entries are editable and 'reversed' entries are neutralized by a reversal.",
        },
        source: {
          type: Sequelize.ENUM('manual', 'system', 'api'),
          allowNull: false,
          comment:
            'Indicates how the journal entry was created, allowing differentiation between user input, automated processes, and external integrations for audit purposes.',
        },
        reference: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'External or business reference identifier such as invoice number or integration ID, used to link the journal entry to external systems or documents.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment:
            'Human-readable explanation of the transaction, providing context for auditors and users reviewing the entry.',
        },
        posted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment:
            'Date and time when the journal entry was officially posted and started affecting financial balances, ensuring precise auditability and period control.',
        },
        entry_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment:
            'Accounting date of the transaction, used for financial reporting and period calculations regardless of when the entry was created in the system.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was created in the table, used for system-level auditing and traceability.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was last modified, typically only applicable while the entry is in draft state.',
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment:
            'Date and time when the record was deactivated; if null the record is active, otherwise it represents a soft deletion while preserving historical data.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Represents a balanced accounting transaction event',
      }
    );

    await queryInterface.addIndex('acct_journal_entries', ['currency_id'], {
      name: 'idx_acct_currency_id',
    });
    await queryInterface.addIndex('acct_journal_entries', ['reversal_of_entry_id'], {
      name: 'idx_acct_reversal_of_entry_id',
    });
    await queryInterface.addIndex('acct_journal_entries', ['fiscal_period_id'], {
      name: 'idx_acct_fiscal_period_id',
    });

    await queryInterface.addConstraint('acct_journal_entries', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_acct_currency_id',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_journal_entries', {
      fields: ['fiscal_period_id'],
      type: 'foreign key',
      name: 'fk_acct_fiscal_period_id',
      references: {
        table: 'acct_fiscal_periods',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_journal_entries', {
      fields: ['reversal_of_entry_id'],
      type: 'foreign key',
      name: 'fk_acct_reversal_of_entry_id',
      references: {
        table: 'acct_journal_entries',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_journal_entries');
  },
};
