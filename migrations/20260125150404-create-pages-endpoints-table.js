'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_pages_has_endpoints',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each page-endpoint relationship.',
        },
        page_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Page ID.',
        },
        endpoint_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Endpoint ID.',
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
        comment: 'Relationship of endpoint usage on each page.',
      }
    );

    await queryInterface.addIndex('config_pages_has_endpoints', ['page_id', 'endpoint_id'], {
      name: 'page_endpoint',
      unique: true,
    });

    await queryInterface.addIndex('config_pages_has_endpoints', ['page_id'], {
      name: 'page',
    });

    await queryInterface.addIndex('config_pages_has_endpoints', ['endpoint_id'], {
      name: 'endpoint',
    });

    await queryInterface.addConstraint('config_pages_has_endpoints', {
      fields: ['page_id'],
      type: 'foreign key',
      name: 'config_pages_has_endpoints_ibfk_1',
      references: {
        table: 'config_pages',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('config_pages_has_endpoints', {
      fields: ['endpoint_id'],
      type: 'foreign key',
      name: 'config_pages_has_endpoints_ibfk_2',
      references: {
        table: 'config_endpoints',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_pages_has_endpoints');
  },
};
