'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_tokens',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each created token.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: "ID of the user's account for which the token was created.",
          references: {
            model: 'usr_accounts',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        token: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Form or content of the token.',
        },
        purpose: {
          type: Sequelize.ENUM(
            'confirm_email',
            'confirm_recovery_email',
            'confirm_phone',
            'recover_password',
            'secure_device'
          ),
          allowNull: false,
          comment: 'Purpose of the token.',
        },
        expires_in: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Indicates the date and time limit for the use of the token.',
        },
        used_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Date and time the token was used.',
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
        collate: 'utf8mb4_unicode_ci',
        comment: 'Table that stores the purpose and information of tokens.',
        indexes: [
          {
            fields: ['account_id'],
            name: 'idx_account_id',
          },
        ],
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_tokens');
  },
};
