'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_credentials',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique ID for each credential.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the account to which the credential belongs.',
        },
        credential_type: {
          type: Sequelize.ENUM('email', 'phone', 'document', 'internal_code'),
          allowNull: false,
          comment: 'Type of credential.',
        },
        credential_value: {
          type: Sequelize.STRING(150),
          allowNull: false,
          comment: 'Credential value.',
        },
        verified_at: {
          type: 'TIMESTAMP',
          allowNull: true,
          comment: 'Timestamp of when the credential was verified.',
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
        comment: 'Credentials available for each account.',
      }
    );

    await queryInterface.addIndex('usr_credentials', ['account_id'], {
      name: 'account',
    });

    await queryInterface.addConstraint('usr_credentials', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'usr_credentials_ibfk_1',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_credentials');
  },
};
