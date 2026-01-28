'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_pages_endpoints_has_schemas',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Primary key, unique identifier for each page-endpoint-field relationship.',
        },
        page_endpoint_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Foreign key referencing the page-endpoint relationship.',
        },
        endpoint_field_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Foreign key referencing the specific endpoint field configuration.',
        },
        location: {
          type: Sequelize.ENUM('body', 'params', 'query', 'header', 'auth_token'),
          allowNull: false,
          comment:
            'Field location in the request from the page: body, parameters (path), query (URL), header, or auth_token',
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
        comment: 'Maps which fields are used in page-endpoint relationships',
      }
    );

    await queryInterface.addIndex('config_pages_endpoints_has_schemas', ['page_endpoint_id', 'endpoint_field_id'], {
      name: 'page_endpoint_schema_UN',
      unique: true,
    });

    await queryInterface.addIndex('config_pages_endpoints_has_schemas', ['page_endpoint_id'], {
      name: 'page_endpoint',
    });

    await queryInterface.addIndex('config_pages_endpoints_has_schemas', ['endpoint_field_id'], {
      name: 'endpoint_field',
    });

    await queryInterface.addConstraint('config_pages_endpoints_has_schemas', {
      fields: ['endpoint_field_id'],
      type: 'foreign key',
      name: 'config_pages_endpoints_has_schemas_ibfk_2',
      references: {
        table: 'config_endpoints_request_schema',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_pages_endpoints_has_schemas');
  },
};
