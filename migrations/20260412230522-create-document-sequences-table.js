'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_document_sequences',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each document sequence configuration.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'Unique internal identifier for the sequence (e.g. SALES_INVOICE_MAIN).',
        },
        prefix: {
          type: Sequelize.STRING(20),
          allowNull: false,
          comment: 'Prefix used in generated document numbers (e.g. INV, REC, PAY).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Human-readable explanation of what this sequence is used for.',
        },
        next_number: {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 1,
          comment: 'Next sequential number to be assigned when generating a new document.',
        },
        padding: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 6,
          comment: 'Number of digits for zero-padding (e.g. 6 → 000001).',
        },
        increment_step: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: 'Step increment for each new number (normally 1, but configurable for special cases).',
        },
        last_generated_number: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'Last number that was successfully generated, used for audit and recovery.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this sequence is system-defined and should not be modified or deleted.',
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
        comment: 'Controls numbering sequences for accounting docs',
      }
    );

    await queryInterface.addIndex('acct_document_sequences', ['code'], {
      name: 'uq_acct_code',
      unique: true,
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_document_sequences');
  },
};
