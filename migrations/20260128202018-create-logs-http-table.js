'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'logs_http_requests',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: "Unique primary key for identifying each HTTPS's request.",
        },
        access_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Access ID that performed the action. With this you can get account, user and device.',
        },
        page_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Page ID of the page where the request was made.',
        },
        endpoint_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Endpoint ID of the endpoint where the request was made.',
        },
        id_request: {
          type: Sequelize.STRING(36),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Unique ID of the request.',
        },
        id_operation: {
          type: Sequelize.STRING(36),
          allowNull: true,
          defaultValue: null,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Unique ID of the operation.',
        },
        path: {
          type: Sequelize.STRING(150),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Request route. Used to record its parameters.',
        },
        query: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Request query parameters.',
        },
        headers: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Request headers (exclude sensitive).',
        },
        body: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Request body (exclude sensitive).',
        },
        http_code: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'HTTP response code.',
        },
        response_body: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Response body (exclude sensitive).',
        },
        status_code: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Status code of the response. Mostly used for errors and to differentiate HTTP response codes.',
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Error message.',
        },
        error_stack: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Error stack (just in development).',
        },
        created_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created in the table.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table for storing logs of HTTP requests.',
      }
    );

    await queryInterface.addIndex('logs_http_requests', ['id_request'], { name: 'request_id_UN', unique: true });

    await queryInterface.addIndex('logs_http_requests', ['access_id'], { name: 'access' });

    await queryInterface.addIndex('logs_http_requests', ['page_id'], { name: 'page' });

    await queryInterface.addIndex('logs_http_requests', ['endpoint_id'], { name: 'endpoint' });

    await queryInterface.addConstraint('logs_http_requests', {
      fields: ['access_id'],
      type: 'foreign key',
      name: 'access',
      references: {
        table: 'usr_accesses',
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    await queryInterface.addConstraint('logs_http_requests', {
      fields: ['page_id'],
      type: 'foreign key',
      name: 'page',
      references: {
        table: 'config_pages',
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    await queryInterface.addConstraint('logs_http_requests', {
      fields: ['endpoint_id'],
      type: 'foreign key',
      name: 'endpoint',
      references: {
        table: 'config_endpoints',
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('users');
  },
};
