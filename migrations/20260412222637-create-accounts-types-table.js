'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_account_types',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique primary key to identify each account type.',
        },
        slug: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true,
          comment:
            'Stable internal identifier for the account type, used in code and integrations instead of names to avoid breaking changes when labels are modified.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment:
            'Public display name of the account type stored as JSON to support multiple languages and internationalization requirements.',
        },
        normal_balance: {
          type: Sequelize.ENUM('debit', 'credit'),
          allowNull: false,
          comment:
            'Defines the natural balance direction of the account type, indicating whether increases are represented as debit or credit, which is essential for correct balance calculations.',
        },
        financial_statement: {
          type: Sequelize.ENUM('balance_sheet', 'income_statement'),
          allowNull: false,
          comment:
            'Indicates which financial report the account type belongs to, allowing the system to group accounts into balance sheet or income statement categories.',
        },
        position: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 0,
          comment:
            'Determines the display order of account types in financial reports, enabling consistent and configurable ordering without hardcoding logic.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates whether the account type is system-defined and protected from modification, ensuring core accounting categories cannot be altered or deleted by users.',
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
            'Date and time when the record was deactivated. If the value is null, it means the record is still active; otherwise, it indicates that the record has been deactivated (known as soft deletion), without removing the information from the table.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Defines accounting behavior for account categories',
      }
    );

    // Unique index on slug
    await queryInterface.addIndex('acct_account_types', ['slug'], {
      name: 'uq_acct_slug',
      unique: true,
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_account_types');
  },
};
