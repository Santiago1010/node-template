'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'acct_counterparties',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each counterparty.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'FK to usr_accounts. Links counterparty to a system user account when applicable.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'FK to geo_countries. Country where the counterparty is registered or operates.',
        },
        city_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'FK to geo_cities. City where the counterparty is located.',
        },
        type: {
          type: Sequelize.ENUM('customer', 'supplier', 'employee', 'bank', 'government', 'intercompany', 'other'),
          allowNull: false,
          comment: 'Classifies the counterparty to enable filtering and balance reporting by type.',
        },
        legal_name: {
          type: Sequelize.STRING(200),
          allowNull: false,
          comment: 'Official registered name of the counterparty, used in legal documents and reports.',
        },
        trade_name: {
          type: Sequelize.STRING(200),
          allowNull: true,
          comment: 'Commercial or trade name if different from legal name.',
        },
        id_tax: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: 'Tax identification number (NIT, RUT, EIN, VAT, etc.) of the counterparty.',
        },
        id_tax_type: {
          type: Sequelize.STRING(30),
          allowNull: true,
          comment: 'Type of tax identification document (e.g. NIT, RUT, EIN, CNPJ). Country-dependent.',
        },
        address: {
          type: Sequelize.STRING(300),
          allowNull: true,
          comment: 'Physical or registered address of the counterparty.',
        },
        email: {
          type: Sequelize.STRING(150),
          allowNull: true,
          comment: 'Primary contact email for billing and accounting communications.',
        },
        phone: {
          type: Sequelize.STRING(30),
          allowNull: false,
          comment: 'Primary contact phone number including dial code.',
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Internal accounting notes about this counterparty. Not visible to the counterparty.',
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
          comment:
            'Date and time when the record was deactivated. If the value is null, it means the record is still active; otherwise, it indicates that the record has been deactivated (known as soft deletion), without removing the information from the table.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Third parties involved in accounting transactions',
      }
    );

    // Foreign key indexes
    await queryInterface.addIndex('acct_counterparties', ['account_id'], {
      name: 'idx_acct_account_id',
    });
    await queryInterface.addIndex('acct_counterparties', ['country_id'], {
      name: 'idx_acct_country_id',
    });
    await queryInterface.addIndex('acct_counterparties', ['city_id'], {
      name: 'idx_acct_city_id',
    });

    // Foreign key constraints
    await queryInterface.addConstraint('acct_counterparties', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_acct_account_id',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_counterparties', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'fk_acct_country_id',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('acct_counterparties', {
      fields: ['city_id'],
      type: 'foreign key',
      name: 'fk_acct_city_id',
      references: {
        table: 'geo_cities',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('acct_counterparties');
  },
};
