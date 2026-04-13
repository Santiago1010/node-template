'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_item_attributes',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each attribute definition.',
        },
        slug: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Stable internal identifier used in code and integrations (e.g. color, size, ram).',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the attribute in multiple languages.',
        },
        description: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional description explaining the purpose of the attribute.',
        },
        data_type: {
          type: Sequelize.ENUM('text', 'number', 'boolean', 'date', 'select'),
          allowNull: false,
          comment: 'Defines the type of data this attribute stores, enabling validation and correct processing.',
        },
        unit: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: null,
          comment: 'Unit of measurement when applicable (e.g. kg, GB, cm).',
        },
        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this attribute must be provided for applicable items.',
        },
        is_filterable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this attribute can be used in filters (e.g. e-commerce search).',
        },
        is_variant_axis: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this attribute defines item variants (e.g. size, color).',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the attribute is system-defined and protected from modification.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible field for additional configuration not yet structurally modeled.',
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
        comment: 'Defines attributes applicable to items',
      }
    );

    await queryInterface.addIndex('core_item_attributes', ['slug'], {
      name: 'uq_core_item_attributes_slug',
      unique: true,
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_item_attributes');
  },
};
