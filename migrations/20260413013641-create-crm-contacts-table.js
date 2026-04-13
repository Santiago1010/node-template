'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'crm_contacts',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each CRM contact.',
        },
        email: {
          type: Sequelize.STRING(150),
          allowNull: true,
          defaultValue: null,
          unique: true,
          comment:
            'Unique email address of the contact. Used for communication and identification. Nullable because not all contacts have email.',
        },
        account_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to crm_accounts. Defines which CRM account (company or individual) this contact belongs to.',
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to usr_users. Links this contact to a system user if they have login access. Nullable for external contacts.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Full name of the contact stored as JSON for multilingual support.',
        },
        position: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment: 'Job title or role within the organization (e.g. CEO, Accountant, Buyer).',
        },
        phone: {
          type: Sequelize.STRING(30),
          allowNull: true,
          defaultValue: null,
          comment: 'Primary phone number of the contact including country code.',
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this is the main contact for the account. Only one contact per account should typically be marked as primary.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether the contact is active for communication and operations.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible JSON field to store additional contact-specific information (e.g. preferences, notes, tags).',
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
        comment: 'CRM contacts table.',
      }
    );

    await queryInterface.addIndex('crm_contacts', ['account_id'], {
      name: 'idx_crm_contacts_account_id',
    });

    await queryInterface.addIndex('crm_contacts', ['user_id'], {
      name: 'idx_crm_contacts_user_id',
    });

    await queryInterface.addConstraint('crm_contacts', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_crm_contacts_account',
      references: {
        table: 'crm_accounts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('crm_contacts', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_crm_contacts_user',
      references: {
        table: 'usr_users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('crm_contacts');
  },
};
