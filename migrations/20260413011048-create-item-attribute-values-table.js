'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_item_attribute_values',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each attribute value record.',
        },
        item_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the item that owns this attribute value.',
        },
        attribute_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'References the attribute being assigned.',
        },
        attribute_option_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: "References selected option when attribute type is 'select'.",
        },
        value_text: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: "Stores value when attribute data_type is 'text'.",
        },
        value_number: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: true,
          defaultValue: null,
          comment: "Stores value when attribute data_type is 'number'.",
        },
        value_boolean: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: null,
          comment: "Stores value when attribute data_type is 'boolean'.",
        },
        value_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: "Stores value when attribute data_type is 'date'.",
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
        comment: 'Stores attribute values for items',
      }
    );

    await queryInterface.addIndex('core_item_attribute_values', ['item_id', 'attribute_id'], {
      name: 'uq_core_item_attribute_values_item_attribute',
      unique: true,
    });

    await queryInterface.addIndex('core_item_attribute_values', ['item_id'], {
      name: 'idx_core_item_attribute_values_item_id',
    });

    await queryInterface.addIndex('core_item_attribute_values', ['attribute_id'], {
      name: 'idx_core_item_attribute_values_attribute_id',
    });

    await queryInterface.addIndex('core_item_attribute_values', ['attribute_option_id'], {
      name: 'idx_core_item_attribute_values_attribute_option_id',
    });

    await queryInterface.addConstraint('core_item_attribute_values', {
      fields: ['item_id'],
      type: 'foreign key',
      name: 'fk_core_item_attribute_values_item',
      references: {
        table: 'core_items',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_item_attribute_values', {
      fields: ['attribute_id'],
      type: 'foreign key',
      name: 'fk_core_item_attribute_values_attribute',
      references: {
        table: 'core_item_attributes',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_item_attribute_values', {
      fields: ['attribute_option_id'],
      type: 'foreign key',
      name: 'fk_core_item_attribute_values_attribute_option',
      references: {
        table: 'core_item_attribute_options',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_item_attribute_values');
  },
};
