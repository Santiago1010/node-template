'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_documents',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each accounting document.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Human-readable document number used for tracking and auditing (e.g. INV-2025-0001).',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'References the currency in which the document is issued.',
        },
        document_type_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment:
            'References the document type that defines the business behavior, validation rules, and accounting impact of this document, replacing the previous string-based classification.',
        },
        counterparty_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'References the counterparty involved in the document (customer, supplier, etc.).',
        },
        journal_entry_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'References the journal entry associated with this document.',
        },
        exchange_rate_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment:
            'Optional reference to the exchange rate record used as source for this document. This does not affect the stored exchange rate value.',
        },
        external_reference: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'External reference identifier from another system (e.g. e-commerce order ID, payment gateway ID).',
        },
        total_amount: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'otal monetary amount of the document in its currency.',
        },
        paid_amount: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Total amount that has been paid or applied to this document.',
        },
        exchange_rate: {
          type: Sequelize.DECIMAL(19, 8),
          allowNull: true,
          comment:
            'Exchange rate applied to convert the document total from its original currency to the system base currency at the time of issuance.',
        },
        total_amount_base: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment:
            'Total monetary amount of the document converted into the system base currency using the exchange rate, ensuring consistent financial reporting.',
        },
        status: {
          type: Sequelize.ENUM('draft', 'issued', 'cancelled'),
          allowNull: false,
          defaultValue: 'draft',
          comment:
            'Indicates the lifecycle state of the document. Draft is editable, issued is final, cancelled invalidates it without deletion.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Human-readable explanation of the document.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Flexible JSON field to store additional business-specific data without altering schema.',
        },
        issue_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when the document is officially issued.',
        },
        due_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          comment: 'Payment due date for documents like invoices.',
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
        comment: 'Business documents generating journal entries',
      }
    );

    // Unique index for code
    await queryInterface.addIndex('acct_documents', ['code'], {
      name: 'uq_acct_code',
      unique: true,
    });

    // Foreign key indexes
    await queryInterface.addIndex('acct_documents', ['currency_id'], {
      name: 'idx_acct_currency_id',
    });
    await queryInterface.addIndex('acct_documents', ['document_type_id'], {
      name: 'idx_acct_document_type_id',
    });
    await queryInterface.addIndex('acct_documents', ['counterparty_id'], {
      name: 'idx_acct_counterparty_id',
    });
    await queryInterface.addIndex('acct_documents', ['journal_entry_id'], {
      name: 'idx_acct_journal_entry_id',
    });
    await queryInterface.addIndex('acct_documents', ['exchange_rate_id'], {
      name: 'idx_acct_exchange_rate_id',
    });
    await queryInterface.addIndex('acct_documents', ['exchange_rate'], {
      name: 'idx_acct_exchange_rate',
    });

    // Foreign key constraints
    await queryInterface.addConstraint('acct_documents', {
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
    await queryInterface.addConstraint('acct_documents', {
      fields: ['document_type_id'],
      type: 'foreign key',
      name: 'fk_acct_document_type_id',
      references: {
        table: 'acct_document_types',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('acct_documents', {
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
    await queryInterface.addConstraint('acct_documents', {
      fields: ['journal_entry_id'],
      type: 'foreign key',
      name: 'fk_acct_journal_entry_id',
      references: {
        table: 'acct_journal_entries',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('acct_documents', {
      fields: ['exchange_rate_id'],
      type: 'foreign key',
      name: 'fk_acct_exchange_rate_id',
      references: {
        table: 'acct_exchange_rates',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_documents');
  },
};
