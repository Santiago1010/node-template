'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_competencies',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each competency.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the competency (e.g. LEADERSHIP, TEAMWORK, JAVA_PROGRAMMING).',
        },
        category_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_competency_categories. Defines the category this competency belongs to.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the competency in multiple languages (e.g. {"en":"Leadership","es":"Liderazgo"}).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Detailed explanation of the competency, including behaviors or expectations associated with it.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this competency is currently active and available for use.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this competency is system-defined and protected from deletion.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible configuration (e.g. mapping to roles, tags, weighting hints, organization-specific attributes).',
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
        comment: 'Competencies definition.',
      }
    );

    await queryInterface.addIndex('hr_competencies', ['code'], {
      unique: true,
      name: 'uq_hr_competencies_code',
    });

    await queryInterface.addIndex('hr_competencies', ['category_id'], {
      name: 'idx_hr_competencies_category_id',
    });

    await queryInterface.addConstraint('hr_competencies', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'fk_hr_competencies_category',
      references: {
        table: 'hr_competency_categories',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_competencies');
  },
};
