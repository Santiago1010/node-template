'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_devices',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each device.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Account ID that owns this device.',
        },
        fingerprint: {
          type: Sequelize.STRING(64),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Unique hash identifying the device (based on user agent, IP pattern, etc).',
        },
        name: {
          type: Sequelize.STRING(150),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Friendly name for the device (e.g., "iPhone de Juan", "Chrome en Windows").',
        },
        type: {
          type: Sequelize.ENUM('desktop', 'mobile', 'tablet', 'other'),
          allowNull: false,
          defaultValue: 'other',
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Type of device.',
        },
        browser: {
          type: Sequelize.STRING(50),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Browser name and version.',
        },
        os: {
          type: Sequelize.STRING(50),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Operating system.',
        },
        is_trusted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the device is trusted.',
        },
        is_blocked: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the device has been blocked.',
        },
        last_ip: {
          type: Sequelize.STRING(45),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Last IP address used by this device.',
        },
        last_used_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Last time this device was used.',
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
          comment: 'Soft delete timestamp.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Registered devices for each account.',
      }
    );

    await queryInterface.addIndex('usr_devices', ['account_id'], {
      name: 'account',
    });

    await queryInterface.addIndex('usr_devices', ['fingerprint'], {
      name: 'fingerprint_UN',
    });

    await queryInterface.addConstraint('usr_devices', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'usr_devices_ibfk_1',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('usr_accesses', {
      fields: ['device_id'],
      type: 'foreign key',
      name: 'usr_accesses_ibfk_2',
      references: {
        table: 'usr_devices',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_devices');
  },
};
