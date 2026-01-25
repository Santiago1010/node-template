'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_security_levels',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Autonumeric identifier for each security level.',
        },
        slug: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Name of the security level in slug format.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the security level with internationalization.',
        },
        priority: {
          type: Sequelize.TINYINT(1),
          allowNull: false,
          comment: '1 = least sensitive ... n = most sensitive.',
        },
        description: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Detailed description of each security level with internationalization.',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          comment: 'Indicate whether this is a default level. Only one can be marked as default.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created.',
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
        comment: 'Application access security levels.',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_security_levels');
  },
};
