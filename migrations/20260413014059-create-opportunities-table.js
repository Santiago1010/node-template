'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'crm_opportunities',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each sales opportunity.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment:
            'Unique business identifier for the opportunity (e.g. OPP-2026-0001). Used for tracking and referencing.',
        },
        account_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to crm_accounts. The customer this opportunity belongs to.',
        },
        lead_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to crm_leads. Source lead from which this opportunity originated. Nullable if created directly.',
        },
        owner_user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to usr_users. Sales representative responsible for this opportunity.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name or title of the opportunity (e.g. "Annual SaaS Subscription 50 users").',
        },
        stage: {
          type: Sequelize.ENUM('qualification', 'proposal', 'negotiation', 'won', 'lost'),
          allowNull: false,
          defaultValue: 'qualification',
          comment: 'Pipeline stage of the opportunity.',
        },
        status: {
          type: Sequelize.ENUM('open', 'won', 'lost', 'cancelled'),
          allowNull: false,
          defaultValue: 'open',
          comment: 'Overall state of the opportunity independent of stage.',
        },
        amount_estimated: {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Estimated monetary value of the opportunity.',
        },
        probability: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Probability of closing the opportunity (0–100). Used for weighted forecasting.',
        },
        expected_close_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Expected date when the opportunity will be closed.',
        },
        source: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment: 'Origin of the opportunity (e.g. upsell, cross-sell, campaign_xyz).',
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Internal notes regarding negotiations, requirements, or context.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible JSON field for additional opportunity-specific attributes.',
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
        comment: 'CRM sales opportunities table.',
      }
    );

    await queryInterface.addIndex('crm_opportunities', ['account_id'], {
      name: 'idx_crm_opportunities_account_id',
    });

    await queryInterface.addIndex('crm_opportunities', ['lead_id'], {
      name: 'idx_crm_opportunities_lead_id',
    });

    await queryInterface.addIndex('crm_opportunities', ['owner_user_id'], {
      name: 'idx_crm_opportunities_owner_user_id',
    });

    await queryInterface.addConstraint('crm_opportunities', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_crm_opportunities_account',
      references: {
        table: 'crm_accounts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('crm_opportunities', {
      fields: ['lead_id'],
      type: 'foreign key',
      name: 'fk_crm_opportunities_lead',
      references: {
        table: 'crm_leads',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('crm_opportunities', {
      fields: ['owner_user_id'],
      type: 'foreign key',
      name: 'fk_crm_opportunities_owner',
      references: {
        table: 'usr_users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('crm_opportunities');
  },
};
