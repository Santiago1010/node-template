'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_accesses',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each access.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Account ID.',
        },
        device_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the device from which the access was recorded.',
        },
        id_token: {
          type: Sequelize.STRING(100),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment:
            'Unique ID of the encrypted JWT token (not the primary key because it is recommended to encrypt it).',
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Date and time the access expires. Updated each time the token is refreshed.',
        },
        is_safe_mode: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether access was performed in safe mode.',
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
        comment: 'Log of account access and devices.',
      }
    );

    await queryInterface.addIndex('usr_accesses', ['id_token'], {
      name: 'token_UN',
      unique: true,
    });

    await queryInterface.addIndex('usr_accesses', ['account_id'], {
      name: 'account',
    });

    await queryInterface.addIndex('usr_accesses', ['device_id'], {
      name: 'device',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_accesses');
  },
};
