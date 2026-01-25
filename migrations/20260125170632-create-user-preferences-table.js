'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_preferences',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each created preference.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the account to which the preferences belong.',
        },
        language_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the language selected by the user as their preference.',
        },
        timezone_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the time zone that the user selects as their preference for the platform.',
        },
        theme: {
          type: Sequelize.ENUM('ligth', 'dark'),
          allowNull: false,
          defaultValue: 'ligth',
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Preferred theme type (color scheme) of the platform for the user.',
        },
        whatsapp: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether you allow receiving notifications via WhatsApp.',
        },
        sms: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether you allow receiving SMS notifications.',
        },
        email: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether you allow receiving notifications and/or advertising by email.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores user preferences (settings).',
      }
    );

    await queryInterface.addIndex('usr_preferences', ['account_id'], {
      name: 'account',
    });

    await queryInterface.addIndex('usr_preferences', ['language_id'], {
      name: 'language',
    });

    await queryInterface.addIndex('usr_preferences', ['timezone_id'], {
      name: 'timezone',
    });

    await queryInterface.addConstraint('usr_preferences', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'usr_preferences_ibfk_1',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_preferences');
  },
};
