'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'config_shorteners',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Autonumeric identifier for each link shortener.',
        },
        url: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Full URL.',
        },
        code_shortener: {
          type: Sequelize.STRING(8),
          allowNull: false,
          comment: 'Unique identification code for link.',
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Date and time limit for use of the shortener.',
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
        comment: 'Codes assigned to different links to cut them.',
      }
    );

    await queryInterface.addIndex('config_shorteners', ['url', 'code_shortener'], {
      name: 'url_code_shortener_UN',
      unique: true,
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('config_shorteners');
  },
};
