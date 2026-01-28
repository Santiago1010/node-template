'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_pages',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key to identify each page.',
        },
        host_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the client to which the page belongs.',
        },
        page_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'ID of the parent page to which the child belongs. If null, it is a "first-line page".',
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Page name (extracted from Vue router 4).',
        },
        path: {
          type: Sequelize.STRING(200),
          allowNull: false,
          comment:
            'Path of the specific page for identification. It must be exactly the same as the path used by the end user to access the view.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Optional description of what can be done or viewed on the page.',
        },
        level: {
          type: Sequelize.TINYINT(1),
          allowNull: false,
          defaultValue: 1,
          comment: 'Indicates whether it is level 1, 2, or 3 (this being the last level allowed).',
        },
        requires_authorization: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether the page requires authorization to access it.',
        },
        has_sensitive_information: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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
        comment: "Table that stores the application's frontend pages.",
      }
    );

    await queryInterface.addIndex('config_pages', ['page_id'], {
      name: 'parent',
    });

    await queryInterface.addIndex('config_pages', ['host_id'], {
      name: 'host',
    });

    await queryInterface.addIndex('config_pages', ['page_id'], {
      name: 'parent_page',
    });

    await queryInterface.addConstraint('config_pages', {
      fields: ['page_id'],
      type: 'foreign key',
      name: 'config_pages_ibfk_1',
      references: {
        table: 'config_pages',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('config_pages', {
      fields: ['host_id'],
      type: 'foreign key',
      name: 'config_pages_ibfk_2',
      references: {
        table: 'config_hosts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_pages');
  },
};
