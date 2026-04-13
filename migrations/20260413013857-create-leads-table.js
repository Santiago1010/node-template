'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'crm_leads',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each lead.',
        },
        email: {
          type: Sequelize.STRING(150),
          allowNull: true,
          defaultValue: null,
          unique: true,
          comment:
            'Unique email address of the lead. Nullable because some leads may be captured without email (e.g. phone-only).',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to usr_accounts. If the lead is already associated with a system account, this links to it. Nullable for anonymous leads.',
        },
        contact_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to crm_contacts. Optional link if the lead is tied to a known contact.',
        },
        owner_user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to usr_users. Internal user responsible for managing and qualifying this lead.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Name of the lead (person or company) stored as JSON for multilingual support.',
        },
        company_name: {
          type: Sequelize.STRING(200),
          allowNull: true,
          defaultValue: null,
          comment: 'Company name if the lead represents a business.',
        },
        source: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment: 'Origin of the lead (e.g. website, campaign_xyz, referral, cold_call). Used for attribution.',
        },
        status: {
          type: Sequelize.ENUM('new', 'contacted', 'qualified', 'unqualified', 'converted'),
          allowNull: false,
          defaultValue: 'new',
          comment:
            'Lifecycle state of the lead. new: just created. contacted: outreach initiated. qualified: valid opportunity. unqualified: discarded. converted: turned into crm_account.',
        },
        score: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Numeric score representing lead quality or priority. Higher values indicate more promising leads.',
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Free-form notes captured during qualification process.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible JSON field to store additional lead-specific attributes (e.g. campaign data, tracking parameters).',
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
        comment: 'CRM leads table.',
      }
    );

    await queryInterface.addIndex('crm_leads', ['account_id'], {
      name: 'idx_crm_leads_account_id',
    });

    await queryInterface.addIndex('crm_leads', ['contact_id'], {
      name: 'idx_crm_leads_contact_id',
    });

    await queryInterface.addIndex('crm_leads', ['owner_user_id'], {
      name: 'idx_crm_leads_owner_user_id',
    });

    await queryInterface.addConstraint('crm_leads', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_crm_leads_account',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('crm_leads', {
      fields: ['contact_id'],
      type: 'foreign key',
      name: 'fk_crm_leads_contact',
      references: {
        table: 'crm_contacts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('crm_leads', {
      fields: ['owner_user_id'],
      type: 'foreign key',
      name: 'fk_crm_leads_owner',
      references: {
        table: 'usr_users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('crm_leads');
  },
};
