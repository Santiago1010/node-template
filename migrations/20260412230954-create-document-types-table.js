'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_document_types',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each document type.',
        },
        slug: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'Stable internal identifier used in code and integrations (e.g. sales_invoice, purchase_invoice).',
        },
        sequence_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'References the default numbering sequence used for this document type.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Public display name of the document type, supporting multiple languages.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional explanation of the purpose and usage of the document type.',
        },
        affects_accounting: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates whether documents of this type generate journal entries. Some documents may be informational only.',
        },
        requires_counterparty: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether a counterparty is required (e.g. invoices yes, internal adjustments no).',
        },
        allow_manual_entries: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether users can manually create documents of this type.',
        },
        auto_post: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether documents of this type automatically generate and post journal entries upon issuance.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          comment: 'Indicates whether the document type is system-defined and protected from modification.',
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
        comment: 'Defines types and behavior of accounting docs',
      }
    );

    await queryInterface.addIndex('acct_document_types', ['slug'], {
      name: 'uq_acct_slug',
      unique: true,
    });

    await queryInterface.addIndex('acct_document_types', ['sequence_id'], {
      name: 'idx_acct_sequence_id',
    });

    await queryInterface.addConstraint('acct_document_types', {
      fields: ['sequence_id'],
      type: 'foreign key',
      name: 'fk_acct_sequence_id',
      references: {
        table: 'acct_document_sequences',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_document_types');
  },
};
