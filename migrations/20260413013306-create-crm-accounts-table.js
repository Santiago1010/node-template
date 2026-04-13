'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'crm_accounts',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each CRM account record.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'FK to usr_accounts. Represents the base identity (tenant, company, or individual) that this CRM profile extends.',
        },
        counterparty_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to acct_counterparties. Links this CRM account to its accounting representation when financial transactions exist. Nullable because not all CRM accounts are yet customers or suppliers.',
        },
        owner_user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to usr_users. Internal user responsible for managing this account (e.g. sales rep or account manager).',
        },
        type: {
          type: Sequelize.ENUM('individual', 'company'),
          allowNull: false,
          comment:
            'Defines whether the account represents a natural person (individual) or a legal entity (company). Determines downstream behavior such as taxation, contacts, and document generation.',
        },
        lifecycle_stage: {
          type: Sequelize.ENUM('lead', 'prospect', 'customer', 'inactive'),
          allowNull: false,
          defaultValue: 'lead',
          comment:
            'Represents the commercial lifecycle stage of the account. lead: newly identified. prospect: qualified opportunity. customer: has completed at least one transaction. inactive: no recent activity or churned.',
        },
        segment: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Business segmentation label (e.g. smb, enterprise, vip). Used for reporting, pricing strategies, and sales prioritization.',
        },
        source: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Origin of the account (e.g. website, referral, outbound, campaign_xyz). Useful for attribution and marketing analysis.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates whether the account is currently active for business interactions. This is separate from deleted_at because an account may be inactive but still historically relevant.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible JSON field to store additional CRM-specific attributes without modifying schema (e.g. preferences, scoring data, custom tags).',
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
        comment: 'CRM accounts table.',
      }
    );

    await queryInterface.addIndex('crm_accounts', ['account_id'], {
      name: 'idx_crm_account_id',
    });

    await queryInterface.addIndex('crm_accounts', ['counterparty_id'], {
      name: 'idx_crm_counterparty_id',
    });

    await queryInterface.addIndex('crm_accounts', ['owner_user_id'], {
      name: 'idx_crm_owner_user_id',
    });

    await queryInterface.addConstraint('crm_accounts', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_crm_accounts_account',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('crm_accounts', {
      fields: ['counterparty_id'],
      type: 'foreign key',
      name: 'fk_crm_accounts_counterparty',
      references: {
        table: 'acct_counterparties',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('crm_accounts', {
      fields: ['owner_user_id'],
      type: 'foreign key',
      name: 'fk_crm_accounts_owner',
      references: {
        table: 'usr_users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('crm_accounts');
  },
};
