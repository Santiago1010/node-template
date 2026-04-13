'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_item_variant_attribute_values',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each variant-attribute assignment.',
        },
        variant_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the variant being defined.',
        },
        attribute_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the attribute used in this variant. Must be marked as is_variant_axis.',
        },
        attribute_option_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: "References selected option when attribute is of type 'select'.",
        },
        value_text: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
          comment: 'Stores value when attribute type is text (rare for variants but supported).',
        },
        value_number: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Stores value when attribute type is number (e.g. storage size).',
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
        comment: 'Defines attribute values for each variant',
      }
    );

    await queryInterface.addIndex('core_item_variant_attribute_values', ['variant_id'], {
      name: 'idx_core_item_variant_attribute_values_variant_id',
    });

    await queryInterface.addIndex('core_item_variant_attribute_values', ['attribute_id'], {
      name: 'idx_core_item_variant_attribute_values_attribute_id',
    });

    await queryInterface.addIndex('core_item_variant_attribute_values', ['attribute_option_id'], {
      name: 'idx_core_item_variant_attribute_values_attribute_option_id',
    });

    await queryInterface.addConstraint('core_item_variant_attribute_values', {
      fields: ['variant_id'],
      type: 'foreign key',
      name: 'fk_core_item_variant_attribute_values_variant',
      references: {
        table: 'core_item_variants',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_item_variant_attribute_values', {
      fields: ['attribute_id'],
      type: 'foreign key',
      name: 'fk_core_item_variant_attribute_values_attribute',
      references: {
        table: 'core_item_attributes',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_item_variant_attribute_values', {
      fields: ['attribute_option_id'],
      type: 'foreign key',
      name: 'fk_core_item_variant_attribute_values_attribute_option',
      references: {
        table: 'core_item_attribute_options',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_item_variant_attribute_values');
  },
};
