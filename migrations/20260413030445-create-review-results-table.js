'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_review_results',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each review result.',
        },
        review_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          unique: true,
          comment: 'FK to hr_performance_reviews. Defines which evaluation this result belongs to.',
        },
        rating_scale_level_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_performance_rating_scale_levels. Final rating classification if applicable.',
        },
        overall_score: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Final calculated score of the evaluation (e.g. 4.2500).',
        },
        normalized_score: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: true,
          defaultValue: null,
          comment: 'Score normalized to a standard scale (e.g. 0–100) for cross-comparison.',
        },
        summary: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Final qualitative summary or conclusion of the evaluation.',
        },
        is_calculated: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether the result was system-calculated (1) or manually overridden (0).',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible data (e.g. scoring breakdown, formulas used, calibration adjustments).',
        },
        calculated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Timestamp when the result was calculated.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the result record was created.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the result was last updated.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );

    await queryInterface.addIndex('hr_performance_review_results', ['review_id'], {
      name: 'idx_hr_perf_results_review',
    });
    await queryInterface.addIndex('hr_performance_review_results', ['rating_scale_level_id'], {
      name: 'idx_hr_perf_results_rating_level',
    });

    await queryInterface.addConstraint('hr_performance_review_results', {
      fields: ['review_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_results_review',
      references: {
        table: 'hr_performance_reviews',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_results', {
      fields: ['rating_scale_level_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_results_rating_level',
      references: {
        table: 'hr_performance_rating_scale_levels',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_review_results');
  },
};
