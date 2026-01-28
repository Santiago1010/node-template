'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_otp_codes',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier of each OTP code.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Account ID associated with the OTP code.',
        },
        code: {
          type: Sequelize.STRING(8),
          allowNull: false,
          comment: 'OTP code.',
        },
        channel: {
          type: Sequelize.ENUM('sms', 'whatsapp', 'email'),
          allowNull: false,
          defaultValue: 'sms',
          comment: 'Channel where the code was sent for use.',
        },
        purpose: {
          type: Sequelize.ENUM('login', 'setup', 'transaction', 'sensitive_actions', 'secure_mode', 'disable'),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_0900_ai_ci',
          comment:
            'Purpose for which the OTP code was requested. Use login for user authentication, setup to enable two-factor authentication, transaction for in-app transactions, sensitive_actions for operations requiring elevated security, and secure_mode to disable secure mode.',
        },
        expires_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          comment: 'Deadline date and time for using the OTP code.',
        },
        used_at: {
          type: 'TIMESTAMP',
          allowNull: true,
          comment: 'Date and time the OTP code was successfully used.',
        },
        created_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created.',
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
        collate: 'utf8mb4_0900_ai_ci',
        comment: 'OTP codes for different purposes.',
      }
    );

    await queryInterface.addIndex('usr_otp_codes', ['account_id', 'code', 'channel', 'purpose'], {
      name: 'code_UN',
      unique: true,
    });

    await queryInterface.addIndex('usr_otp_codes', ['account_id'], {
      name: 'account',
    });

    await queryInterface.addConstraint('usr_otp_codes', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'usr_otp_codes_ibfk_1',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_otp_codes');
  },
};
