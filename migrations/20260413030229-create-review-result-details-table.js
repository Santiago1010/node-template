'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_review_result_details',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each result detail record.',
        },
        review_result_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_review_results. Parent aggregated result.',
        },
        section_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_performance_review_template_sections. Section this detail refers to (if applicable).',
        },
        competency_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_competencies. Competency this detail refers to (if applicable).',
        },
        rating_scale_level_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_performance_rating_scale_levels. Rating classification for this detail.',
        },
        score: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: false,
          comment: 'Calculated score for this section or competency.',
        },
        normalized_score: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Score normalized to a standard scale (e.g. 0-100).',
        },
        weight: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Weight applied in overall calculation (snapshot).',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible data (e.g. breakdown of contributing questions, formulas used).',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the detail record was created.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );

    await queryInterface.addIndex('hr_performance_review_result_details', ['review_result_id'], {
      name: 'idx_hr_perf_result_details_result',
    });
    await queryInterface.addIndex('hr_performance_review_result_details', ['section_id'], {
      name: 'idx_hr_perf_result_details_section',
    });
    await queryInterface.addIndex('hr_performance_review_result_details', ['competency_id'], {
      name: 'idx_hr_perf_result_details_competency',
    });
    await queryInterface.addIndex('hr_performance_review_result_details', ['rating_scale_level_id'], {
      name: 'idx_hr_perf_result_details_rating_level',
    });

    await queryInterface.addConstraint('hr_performance_review_result_details', {
      fields: ['review_result_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_result_details_result',
      references: {
        table: 'hr_performance_review_results',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_result_details', {
      fields: ['section_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_result_details_section',
      references: {
        table: 'hr_performance_review_template_sections',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_result_details', {
      fields: ['competency_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_result_details_competency',
      references: {
        table: 'hr_competencies',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_result_details', {
      fields: ['rating_scale_level_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_result_details_rating_level',
      references: {
        table: 'hr_performance_rating_scale_levels',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_review_result_details');
  },
};
