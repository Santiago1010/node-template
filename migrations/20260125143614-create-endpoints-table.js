'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_endpoints',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique primary key to identify each endpoint.',
        },
        method: {
          type: Sequelize.ENUM('post', 'get', 'put', 'patch', 'delete', 'options'),
          allowNull: false,
          comment: 'Method of the endpoint to which permission will be granted.',
        },
        platform: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Target platform for the endpoint configuration',
        },
        version: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Version identifier of the endpoint configuration',
        },
        endpoint_group: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Grouping of different endpoints',
        },
        path: {
          type: Sequelize.STRING(200),
          allowNull: false,
          comment: 'Path of the endpoint to which permission will be granted.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Optional description of the endpoint's function.",
        },
        requires_authorization: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether or not the endpoint requires authorization to be executed.',
        },
        has_sensitive_information: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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
        comment: 'Table with the permissions of a role with the endpoints.',
      }
    );

    await queryInterface.addIndex('config_endpoints', ['method', 'platform', 'version', 'endpoint_group', 'path'], {
      unique: true,
      name: 'endpoint_UN',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeIndex('config_endpoints', 'endpoint_UN');

    await queryInterface.dropTable('config_endpoints');
  },
};
