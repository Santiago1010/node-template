'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_item_categories_has_attributes',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each category-attribute relationship.',
        },
        category_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the category where the attribute applies.',
        },
        attribute_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the attribute assigned to the category.',
        },
        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this attribute is mandatory for items in this category. Overrides attribute-level default when defined.',
        },
        is_filterable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this attribute should be available for filtering within this category context.',
        },
        is_variant_axis: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this attribute defines variants specifically for this category. Overrides attribute-level configuration when needed.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Defines display and processing order of attributes within the category.',
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
        comment: 'Assigns attributes to item categories',
      }
    );

    await queryInterface.addIndex('core_item_categories_has_attributes', ['category_id'], {
      name: 'idx_core_cat_attr_category_id',
    });

    await queryInterface.addIndex('core_item_categories_has_attributes', ['attribute_id'], {
      name: 'idx_core_cat_attr_attribute_id',
    });

    await queryInterface.addConstraint('core_item_categories_has_attributes', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'fk_core_cat_attr_category',
      references: {
        table: 'core_item_categories',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_item_categories_has_attributes', {
      fields: ['attribute_id'],
      type: 'foreign key',
      name: 'fk_core_cat_attr_attribute',
      references: {
        table: 'core_item_attributes',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_item_categories_has_attributes');
  },
};
