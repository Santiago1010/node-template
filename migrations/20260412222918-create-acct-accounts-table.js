'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_accounts',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment:
            'Unique identifier for each account, used to reference the account across journal entries and ensure relational consistency.',
        },
        code: {
          type: Sequelize.STRING(20),
          allowNull: false,
          comment:
            'Structured account code used for hierarchical ordering and compatibility with traditional accounting systems, allowing predictable grouping and reporting.',
        },
        account_type_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'References the account type that defines the accounting behavior of this account, ensuring correct balance calculations and financial classification.',
        },
        parent_account_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Self-referencing FK. Defines the account hierarchy for grouping and reporting.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment:
            'Public display name of the account stored as JSON to support multiple languages and internationalization requirements.',
        },
        is_postable: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates whether the account can receive journal entry lines; if false, the account is a grouping node only and cannot be directly affected by transactions.',
        },
        allows_manual_entries: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates whether manual journal entries can be posted to this account, enabling control over system-managed versus user-managed accounts.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether the account is system-defined and protected from modification or deletion, ensuring critical accounting structures remain intact.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was created in the table, used for auditability and historical tracking.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment:
            'Date and time when the record was last modified, allowing traceability of configuration changes over time.',
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment:
            'Date and time when the record was deactivated; if null the record is active, otherwise it represents a soft deletion preserving historical integrity.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Chart of accounts structure and behavior',
      }
    );

    // Unique index for code
    await queryInterface.addIndex('acct_accounts', ['code'], {
      name: 'uq_acct_code',
      unique: true,
    });

    // Foreign key indexes
    await queryInterface.addIndex('acct_accounts', ['account_type_id'], {
      name: 'idx_acct_account_type_id',
    });
    await queryInterface.addIndex('acct_accounts', ['parent_account_id'], {
      name: 'idx_acct_parent_account_id',
    });

    // Foreign key constraints
    await queryInterface.addConstraint('acct_accounts', {
      fields: ['account_type_id'],
      type: 'foreign key',
      name: 'fk_acct_account_type_id',
      references: {
        table: 'acct_account_types',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_accounts', {
      fields: ['parent_account_id'],
      type: 'foreign key',
      name: 'fk_acct_parent_account_id',
      references: {
        table: 'acct_accounts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_accounts');
  },
};
