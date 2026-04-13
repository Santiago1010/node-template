'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_items_has_categories',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each item-category relationship.',
        },
        item_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the item being classified.',
        },
        category_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the category assigned to the item.',
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this category is the main classification for the item. Unlike deleted_at, this defines business priority, not record lifecycle.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Defines ordering of categories for a given item (useful for UI or priority logic).',
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
        comment: 'Links items with categories',
      }
    );

    await queryInterface.addIndex('core_items_has_categories', ['item_id'], {
      name: 'idx_core_items_has_cat_item_id',
    });

    await queryInterface.addIndex('core_items_has_categories', ['category_id'], {
      name: 'idx_core_items_has_cat_category_id',
    });

    await queryInterface.addConstraint('core_items_has_categories', {
      fields: ['item_id'],
      type: 'foreign key',
      name: 'fk_core_items_has_cat_item',
      references: {
        table: 'core_items',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_items_has_categories', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'fk_core_items_has_cat_category',
      references: {
        table: 'core_item_categories',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_items_has_categories');
  },
};
