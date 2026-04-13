'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_journal_entry_lines',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment:
            'Unique identifier for each journal entry line, ensuring traceability of each individual accounting movement.',
        },
        journal_entry_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'References the parent journal entry that groups this line within a complete accounting transaction.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'References the account affected by this line, determining where the financial impact is recorded.',
        },
        exchange_rate_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'Optional reference to the exchange rate record used as source for this transaction. This does not affect the stored exchange rate value.',
        },
        counterparty_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'References the related counterparty (customer, supplier, etc.), enabling detailed tracking of obligations and relationships.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'References the currency used in this specific line, enabling advanced multi-currency scenarios when needed.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment:
            'Optional explanation specific to this line, providing additional context beyond the journal entry description.',
        },
        reference: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Optional external reference for this specific line, allowing granular traceability with external systems or documents.',
        },
        exchange_rate: {
          type: Sequelize.DECIMAL(19, 8),
          allowNull: true,
          defaultValue: null,
          comment:
            'Exchange rate applied to convert the transaction amount from its original currency to the system base currency at the time of posting.',
        },
        debit: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment:
            'Monetary amount recorded as a debit; must be zero if credit is greater than zero, ensuring correct accounting balance behavior.',
        },
        credit: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment:
            'Monetary amount recorded as a credit; must be zero if debit is greater than zero, ensuring correct accounting balance behavior.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment:
            'Defines the order of the line within the journal entry, ensuring deterministic processing and display.',
        },
        amount_base_debit: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment:
            'Debit amount converted into the system base currency using the exchange rate, ensuring consistent financial reporting.',
        },
        amount_base_credit: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment:
            'Credit amount converted into the system base currency using the exchange rate, ensuring consistent financial reporting.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was created in the table, ensuring auditability of individual line creation.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was last modified, typically only applicable before the parent entry is posted.',
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment:
            'Date and time when the record was deactivated; if null the record is active, otherwise it represents a soft deletion preserving historical integrity.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Individual debit or credit lines within a journal entry',
      }
    );

    await queryInterface.addIndex('acct_journal_entry_lines', ['journal_entry_id'], {
      name: 'idx_acct_journal_entry_id',
    });
    await queryInterface.addIndex('acct_journal_entry_lines', ['account_id'], {
      name: 'idx_acct_account_id',
    });
    await queryInterface.addIndex('acct_journal_entry_lines', ['counterparty_id'], {
      name: 'idx_acct_counterparty_id',
    });
    await queryInterface.addIndex('acct_journal_entry_lines', ['currency_id'], {
      name: 'idx_acct_currency_id',
    });
    await queryInterface.addIndex('acct_journal_entry_lines', ['exchange_rate_id'], {
      name: 'idx_acct_exchange_rate_id',
    });
    await queryInterface.addIndex('acct_journal_entry_lines', ['exchange_rate'], {
      name: 'idx_acct_exchange_rate',
    });

    await queryInterface.addConstraint('acct_journal_entry_lines', {
      fields: ['journal_entry_id'],
      type: 'foreign key',
      name: 'fk_acct_journal_entry_id',
      references: {
        table: 'acct_journal_entries',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_journal_entry_lines', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_acct_account_id',
      references: {
        table: 'acct_accounts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_journal_entry_lines', {
      fields: ['counterparty_id'],
      type: 'foreign key',
      name: 'fk_acct_counterparty_id',
      references: {
        table: 'acct_counterparties',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_journal_entry_lines', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'fk_acct_currency_id',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_journal_entry_lines');
  },
};
