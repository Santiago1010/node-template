'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_competency_levels',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each competency level.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the level (e.g. LEVEL-1, JUNIOR, SENIOR, EXPERT).',
        },
        level_value: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Numeric representation of the level (e.g. 1-5). Used for ordering and gap calculations.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the level in multiple languages (e.g. {"en":"Beginner","es":"Básico"}).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment:
            'Detailed behavioral description of what is expected at this level (critical for consistent evaluations).',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this level is currently active.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this level is system-defined and protected from deletion.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. mapping to external frameworks, UI hints, scoring equivalences).',
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
        comment: 'Competency levels definition.',
      }
    );

    await queryInterface.addIndex('hr_competency_levels', ['code'], {
      unique: true,
      name: 'uq_hr_competency_levels_code',
    });

    await queryInterface.addIndex('hr_competency_levels', ['level_value'], {
      unique: true,
      name: 'uq_hr_competency_levels_level_value',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_competency_levels');
  },
};
