'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'core_branches',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each branch.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Unique business identifier for the branch (e.g. BR-BOG-001). Used across HR, accounting, and operations.',
        },
        legal_entity_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to core_legal_entities. Legal entity that owns or operates this branch.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_countries. Country where the branch operates.',
        },
        address_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to core_addresses. Physical address of the branch. Optional to allow flexible address handling.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Branch name. Stored as JSON to support multilingual representations if needed.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates if the branch is currently active and operational. 1 = active, 0 = inactive.',
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

    await queryInterface.addIndex('core_branches', ['code'], {
      name: 'uq_core_branches_code',
      unique: true,
    });

    await queryInterface.addIndex('core_branches', ['legal_entity_id'], {
      name: 'idx_core_branches_legal_entity_id',
    });

    await queryInterface.addIndex('core_branches', ['country_id'], {
      name: 'idx_core_branches_country_id',
    });

    await queryInterface.addIndex('core_branches', ['address_id'], {
      name: 'idx_core_branches_address_id',
    });

    await queryInterface.addConstraint('core_branches', {
      fields: ['legal_entity_id'],
      type: 'foreign key',
      name: 'fk_core_branches_legal_entity',
      references: {
        table: 'core_legal_entities',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_branches', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'fk_core_branches_country',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('core_branches', {
      fields: ['address_id'],
      type: 'foreign key',
      name: 'fk_core_branches_address',
      references: {
        table: 'core_addresses',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('core_branches');
  },
};
