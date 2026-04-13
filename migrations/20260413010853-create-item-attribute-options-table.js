'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_item_attribute_options',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each attribute option.',
        },
        slug: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Stable internal identifier for the option (e.g. red, blue, size_m).',
        },
        attribute_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: "References the attribute this option belongs to. Only valid when attribute data_type is 'select'.",
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the option in multiple languages.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: 'Defines display order of options within the attribute.',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this option is the default selection for the attribute.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the option is system-defined and protected from modification.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible field for additional configuration (e.g. color hex, icons).',
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
        comment: 'Predefined values for select attributes',
      }
    );

    await queryInterface.addIndex('core_item_attribute_options', ['slug'], {
      name: 'uq_core_item_attribute_options_slug',
      unique: true,
    });

    await queryInterface.addIndex('core_item_attribute_options', ['attribute_id', 'slug'], {
      name: 'uq_core_item_attribute_options_attribute_id_slug',
      unique: true,
    });

    await queryInterface.addIndex('core_item_attribute_options', ['attribute_id'], {
      name: 'idx_core_item_attribute_options_attribute_id',
    });

    await queryInterface.addConstraint('core_item_attribute_options', {
      fields: ['attribute_id'],
      type: 'foreign key',
      name: 'fk_core_item_attribute_options_attribute',
      references: {
        table: 'core_item_attributes',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_item_attribute_options');
  },
};
