'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_item_variants',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each item variant.',
        },
        code: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Unique internal code for the variant (SKU or internal reference).',
        },
        item_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the base item this variant belongs to.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional variant-specific display name (e.g. "Red / Size M").',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this is the default variant for the item.',
        },
        is_sellable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates whether this variant can be sold. Allows disabling specific combinations without deleting them.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible field for additional data not yet structurally modeled.',
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
        comment: 'Defines concrete sellable item variants',
      }
    );

    await queryInterface.addIndex('core_item_variants', ['code'], {
      name: 'uq_core_variants_code',
      unique: true,
    });

    await queryInterface.addIndex('core_item_variants', ['item_id'], {
      name: 'idx_core_variants_item_id',
    });

    await queryInterface.addConstraint('core_item_variants', {
      fields: ['item_id'],
      type: 'foreign key',
      name: 'fk_core_item_variants_item',
      references: {
        table: 'core_items',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_item_variants');
  },
};
