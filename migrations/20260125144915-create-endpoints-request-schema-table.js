'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_endpoints_request_schema',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Primary key. Unique auto-incrementing identifier for each request schema parameter record',
        },
        endpoint_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'Foreign key reference to the associated API endpoint. Identifies which endpoint this parameter belongs to',
        },
        security_level_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'ID of the security level required to use this property on the endpoint.',
        },
        field_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'ID of the field to which it belongs. This is used for cases where the field is an object or an array of objects.',
        },
        name: {
          type: Sequelize.TEXT('tiny'),
          allowNull: false,
          comment:
            'Canonical name of the request parameter as expected by the API (e.g. in URL, headers, or body). Case-sensitive',
        },
        location: {
          type: Sequelize.ENUM('body', 'params', 'query', 'header', 'auth_token'),
          allowNull: false,
          comment: 'Field location in the request: body, parameters (path), query (URL), header, or auth_token',
        },
        data_type: {
          type: Sequelize.ENUM('string', 'integer', 'boolean', 'array', 'object', 'file', 'float'),
          allowNull: false,
          comment: 'Expected data type for the parameter. Defines how the input should be parsed and validated',
        },
        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates if the parameter is mandatory (TRUE) or optional (FALSE) for the request',
        },
        created_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created in the table.',
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was last modified.',
        },
        deleted_at: {
          type: 'TIMESTAMP',
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
        comment: 'Defines request parameters for API endpoints.',
      }
    );

    await queryInterface.addIndex('config_endpoints_request_schema', ['endpoint_id'], {
      name: 'endpoint',
    });

    await queryInterface.addIndex('config_endpoints_request_schema', ['field_id'], {
      name: 'field',
    });

    await queryInterface.addIndex('config_endpoints_request_schema', ['security_level_id'], {
      name: 'security_level',
    });

    await queryInterface.addConstraint('config_endpoints_request_schema', {
      fields: ['endpoint_id'],
      type: 'foreign key',
      name: 'config_endpoints_request_schema_ibfk_1',
      references: {
        table: 'config_endpoints',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('config_endpoints_request_schema', {
      fields: ['field_id'],
      type: 'foreign key',
      name: 'config_endpoints_request_schema_ibfk_2',
      references: {
        table: 'config_endpoints_request_schema',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_endpoints_request_schema');
  },
};
