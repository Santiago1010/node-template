'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_addresses',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each address record.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to geo_countries. Country where this address is located.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to usr_accounts. The user account that owns this address. Null for addresses belonging to counterparties or used as anonymous shipping addresses.',
        },
        counterparty_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to acct_counterparties. The counterparty this address belongs to when not linked to a system account (e.g. a supplier or external customer). Null when account_id is populated.',
        },
        political_division_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to geo_political_divisions. State, department or province of this address.',
        },
        city_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to geo_cities. City of this address. Null when the city is not in the system catalog and free_city is used instead.',
        },
        address_type: {
          type: Sequelize.ENUM('billing', 'shipping', 'both', 'other'),
          allowNull: false,
          defaultValue: 'both',
          comment:
            'Classifies the intended use of this address. billing: used exclusively for invoicing purposes. shipping: used exclusively for physical delivery. both: valid for billing and shipping. other: internal use, warehouse, registered office, etc.',
        },
        label: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Optional user-defined label to identify this address (e.g. "Main Office", "Warehouse Bogotá", "Home"). Used in UIs to help users distinguish between multiple saved addresses.',
        },
        recipient_name: {
          type: Sequelize.STRING(150),
          allowNull: true,
          defaultValue: null,
          comment:
            'Full name of the person or entity receiving deliveries at this address. May differ from the account holder name (e.g. a receptionist or warehouse manager).',
        },
        recipient_phone: {
          type: Sequelize.STRING(30),
          allowNull: true,
          defaultValue: null,
          comment:
            'Contact phone number for the recipient at this address, including country dial code. Used by carriers to coordinate delivery.',
        },
        address_line_1: {
          type: Sequelize.STRING(200),
          allowNull: false,
          comment:
            'Primary address line containing street name, number, and building identifier (e.g. "Calle 93 # 15-42", "123 Main St Suite 400").',
        },
        address_line_2: {
          type: Sequelize.STRING(200),
          allowNull: true,
          defaultValue: null,
          comment:
            'Secondary address line for additional location details (e.g. apartment number, floor, office, neighborhood, landmark).',
        },
        free_city: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Free-text city name for locations not covered by the geo_cities catalog. Used for international addresses or rural areas. Null when city_id is populated.',
        },
        postal_code: {
          type: Sequelize.STRING(20),
          allowNull: true,
          defaultValue: null,
          comment:
            'Postal or ZIP code of the address. Format varies by country (e.g. "110111" for Colombia, "10001" for USA, "EC1A 1BB" for UK).',
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment:
            'Internal or delivery notes about this address (e.g. "Ring bell twice", "Enter through side gate", "Requires appointment").',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible field for additional address attributes not yet structurally modeled (e.g. geocoding_source, validation_provider, customs_code for international shipments).',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this is the default address for its owner (account or counterparty). Only one address per owner and address_type should be marked as default; enforced at application level.',
        },
        is_verified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this address has been verified by a postal or geocoding service. Unverified addresses may require manual review before shipping.',
        },
        latitude: {
          type: Sequelize.DECIMAL(10, 7),
          allowNull: true,
          defaultValue: null,
          comment: 'Geographic latitude coordinate for mapping and last-mile logistics optimization.',
        },
        longitude: {
          type: Sequelize.DECIMAL(10, 7),
          allowNull: true,
          defaultValue: null,
          comment: 'Geographic longitude coordinate for mapping and last-mile logistics optimization.',
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
          comment: 'Date and time when the record was deactivated. NULL = active. Non-null = soft-deleted.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Reusable physical addresses for orders and billing',
      }
    );

    await queryInterface.addIndex('core_addresses', ['account_id'], {
      name: 'idx_core_account_id',
    });

    await queryInterface.addIndex('core_addresses', ['counterparty_id'], {
      name: 'idx_core_counterparty_id',
    });

    await queryInterface.addIndex('core_addresses', ['country_id'], {
      name: 'idx_core_country_id',
    });

    await queryInterface.addIndex('core_addresses', ['political_division_id'], {
      name: 'idx_core_political_division_id',
    });

    await queryInterface.addIndex('core_addresses', ['city_id'], {
      name: 'idx_core_city_id',
    });

    await queryInterface.addConstraint('core_addresses', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_core_addresses_account',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_addresses', {
      fields: ['counterparty_id'],
      type: 'foreign key',
      name: 'fk_core_addresses_counterparty',
      references: {
        table: 'acct_counterparties',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_addresses', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'fk_core_addresses_country',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_addresses', {
      fields: ['political_division_id'],
      type: 'foreign key',
      name: 'fk_core_addresses_political_division',
      references: {
        table: 'geo_political_divisions',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_addresses', {
      fields: ['city_id'],
      type: 'foreign key',
      name: 'fk_core_addresses_city',
      references: {
        table: 'geo_cities',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_addresses');
  },
};
