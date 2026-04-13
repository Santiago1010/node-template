'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_legal_entities',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each legal entity.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Unique business identifier for the legal entity (e.g. LEGAL-CO-001). Used across HR and accounting processes.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_countries. Country where the legal entity is registered and regulated.',
        },
        tax_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment:
            'Official tax identification number assigned by the government (e.g. NIT, EIN, RFC). Must be unique per country.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Legal name of the entity. Stored as JSON to support multilingual representations if needed.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates if the legal entity is currently active and allowed to employ people. 1 = active, 0 = inactive.',
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
      }
    );

    await queryInterface.addIndex('core_legal_entities', ['code'], {
      name: 'uq_core_legal_entities_code',
      unique: true,
    });

    await queryInterface.addIndex('core_legal_entities', ['tax_id', 'country_id'], {
      name: 'uq_core_legal_entities_tax_id_country_id',
      unique: true,
    });

    await queryInterface.addIndex('core_legal_entities', ['country_id'], {
      name: 'idx_core_legal_entities_country_id',
    });

    await queryInterface.addConstraint('core_legal_entities', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'fk_core_legal_entities_country',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_legal_entities', {
      fields: ['tax_definition_id'],
      type: 'foreign key',
      name: 'fk_core_legal_entities_tax_definition',
      references: {
        table: 'tax_taxes',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_legal_entities');
  },
};
