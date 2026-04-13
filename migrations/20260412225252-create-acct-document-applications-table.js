'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_document_applications',
      {
        id: {
          type: Sequelize.BIGINT.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each application record.',
        },
        document_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the document being settled or paid.',
        },
        id_payment: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'External identifier of the payment (not a foreign key).',
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional notes about the application (e.g. partial payment, adjustment).',
        },
        applied_amount: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Amount applied from the payment to the document.',
        },
        applied_at: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Date and time when the payment was applied to the document.',
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
        collate: 'utf8mb4_unicode_ci',
        comment: 'Links payments to accounting documents',
      }
    );

    await queryInterface.addIndex('acct_document_applications', ['document_id'], {
      name: 'idx_acct_document_id',
    });

    await queryInterface.addConstraint('acct_document_applications', {
      fields: ['document_id'],
      type: 'foreign key',
      name: 'fk_acct_document_applications_document_id',
      references: {
        table: 'acct_documents',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_document_applications');
  },
};
