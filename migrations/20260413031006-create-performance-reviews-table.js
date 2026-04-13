'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_reviews',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each performance review instance.',
        },
        review_assignment_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          unique: true,
          comment: 'FK to hr_performance_review_assignments. Defines who evaluates whom within a cycle.',
        },
        template_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment:
            'FK to hr_performance_review_templates. Template used at the moment of evaluation (reference only, not for runtime dependency).',
        },
        status: {
          type: Sequelize.ENUM('draft', 'in_progress', 'submitted', 'validated', 'locked'),
          allowNull: false,
          defaultValue: 'draft',
          comment:
            'Lifecycle status of the review. draft: not started, in_progress: partially completed, submitted: finished by reviewer, validated: reviewed/approved, locked: final and immutable.',
        },
        overall_comment: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'General qualitative feedback provided by the reviewer.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible data snapshot (e.g. template structure snapshot, weights, flags like anonymity, scoring rules at the time).',
        },
        started_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Timestamp when the reviewer started the evaluation.',
        },
        submitted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Timestamp when the reviewer submitted the evaluation.',
        },
        validated_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Timestamp when the evaluation was validated (e.g. HR or calibration process).',
        },
        locked_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Timestamp when the evaluation became immutable.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the review record was created.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the review was last modified.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );

    // Unique index on review_assignment_id (already created via unique:true, but we add explicit index name)
    await queryInterface.addIndex('hr_performance_reviews', ['review_assignment_id'], {
      unique: true,
      name: 'uq_hr_perf_reviews_assignment',
    });

    await queryInterface.addIndex('hr_performance_reviews', ['review_assignment_id'], {
      name: 'idx_hr_perf_reviews_assignment',
    });
    await queryInterface.addIndex('hr_performance_reviews', ['template_id'], {
      name: 'idx_hr_perf_reviews_template',
    });

    await queryInterface.addConstraint('hr_performance_reviews', {
      fields: ['review_assignment_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_reviews_assignment',
      references: {
        table: 'hr_performance_review_assignments',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_reviews', {
      fields: ['template_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_reviews_template',
      references: {
        table: 'hr_performance_review_templates',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_reviews');
  },
};
