'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_item_categories',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each item category.',
        },
        slug: {
          type: Sequelize.STRING(150),
          allowNull: false,
          comment: 'Stable unique identifier used for integrations and internal logic.',
        },
        parent_category_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'Self-referencing foreign key to define hierarchical structure of categories.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Category name in multiple languages.',
        },
        description: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional detailed description of the category.',
        },
        level: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 1,
          comment: 'Indicates hierarchy level (1 = root, 2 = child, etc.) to simplify queries and validations.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Defines display order within the same parent category.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the category is system-defined and protected from modification.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible field for additional attributes not yet structurally modeled.',
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
        comment: 'Hierarchical classification of items',
      }
    );

    await queryInterface.addIndex('core_item_categories', ['slug'], {
      name: 'uq_core_item_categories_slug',
      unique: true,
    });

    await queryInterface.addIndex('core_item_categories', ['parent_category_id'], {
      name: 'idx_core_item_categories_parent_category_id',
    });

    await queryInterface.addConstraint('core_item_categories', {
      fields: ['parent_category_id'],
      type: 'foreign key',
      name: 'fk_core_item_categories_parent',
      references: {
        table: 'core_item_categories',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_item_categories');
  },
};
