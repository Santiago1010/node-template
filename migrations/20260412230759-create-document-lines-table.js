'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_document_lines',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each document line.',
        },
        document_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the parent document that this line belongs to.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'References the account that will be affected by this line, enabling automatic accounting mapping.',
        },
        item_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'References the catalog item associated with this line, if applicable.',
        },
        variant_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'References the specific item variant sold or purchased in this line.',
        },
        unit_of_measure_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'References the unit of measure in which quantity is expressed. Null for non-inventory lines.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Description of the product or service being recorded in this line.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible JSON field to store additional business-specific data (e.g., product_id, SKU, custom attributes).',
        },
        quantity: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 1.0,
          comment: 'Quantity of items or units for this line.',
        },
        unit_price: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Price per unit before taxes and discounts.',
        },
        discount_amount: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Discount applied to this line before tax calculation.',
        },
        subtotal: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Line subtotal before taxes (quantity × unit_price − discount).',
        },
        total: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Final line total including taxes.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: 'Order of the line within the document for consistent display and processing.',
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
        comment: 'Lines representing items within a document',
      }
    );

    // Add indexes for foreign keys
    await queryInterface.addIndex('acct_document_lines', ['document_id'], {
      name: 'idx_acct_document_id',
    });
    await queryInterface.addIndex('acct_document_lines', ['account_id'], {
      name: 'idx_acct_account_id',
    });
    await queryInterface.addIndex('acct_document_lines', ['item_id'], {
      name: 'idx_acct_item_id',
    });
    await queryInterface.addIndex('acct_document_lines', ['variant_id'], {
      name: 'idx_acct_variant_id',
    });
    await queryInterface.addIndex('acct_document_lines', ['unit_of_measure_id'], {
      name: 'idx_acct_unit_of_measure_id',
    });

    // Add foreign key constraints
    await queryInterface.addConstraint('acct_document_lines', {
      fields: ['document_id'],
      type: 'foreign key',
      name: 'fk_acct_document_id',
      references: {
        table: 'acct_documents',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_document_lines', {
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

    await queryInterface.addConstraint('acct_document_lines', {
      fields: ['item_id'],
      type: 'foreign key',
      name: 'fk_acct_item_id',
      references: {
        table: 'core_items',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_document_lines', {
      fields: ['variant_id'],
      type: 'foreign key',
      name: 'fk_acct_variant_id',
      references: {
        table: 'core_item_variants',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_document_lines', {
      fields: ['unit_of_measure_id'],
      type: 'foreign key',
      name: 'fk_acct_unit_of_measure_id',
      references: {
        table: 'inv_units_of_measure',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_document_lines');
  },
};
