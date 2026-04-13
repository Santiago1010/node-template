'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_items',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each item in the unified catalog.',
        },
        code: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment:
            'Unique internal code used to identify the item across all modules (inventory, assets, services, accounting).',
        },
        slug: {
          type: Sequelize.STRING(150),
          allowNull: false,
          unique: true,
          comment: 'URL-friendly unique identifier used for integrations, APIs, and external references.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the item in multiple languages.',
        },
        description: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Detailed description of the item in multiple languages.',
        },
        item_type: {
          type: Sequelize.ENUM('physical', 'digital', 'service'),
          allowNull: false,
          comment: 'High-level classification of the item, defining its nature and behavior across modules.',
        },
        is_sellable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this item can be sold to customers.',
        },
        is_purchasable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this item can be purchased from suppliers.',
        },
        is_internal_use: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this item is intended for internal use (e.g., assets, tools, internal licenses).',
        },
        is_stockable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the item is managed in inventory with stock tracking.',
        },
        is_serialized: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether each unit must be individually tracked (e.g., serial numbers, IMEI).',
        },
        has_expiration: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the item has expiration control (e.g., food, licenses).',
        },
        is_service_recurring: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the item represents a recurring service (subscription model).',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the item is system-defined and protected from modification.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible field for additional attributes that are not yet modeled structurally.',
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
        comment: 'Unified catalog of all business items',
      }
    );

    await queryInterface.addIndex('core_items', ['code'], {
      name: 'uq_core_code',
      unique: true,
    });

    await queryInterface.addIndex('core_items', ['slug'], {
      name: 'uq_core_slug',
      unique: true,
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_items');
  },
};
