'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_review_responses',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each response.',
        },
        review_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_reviews. Defines which evaluation this response belongs to.',
        },
        question_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_review_template_questions. Question being answered (reference only).',
        },
        section_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment:
            'FK to hr_performance_review_template_sections. Section snapshot reference for grouping and reporting.',
        },
        rating_scale_level_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_performance_rating_scale_levels. Selected level when response_type = rating.',
        },
        competency_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_competencies. Snapshot reference for competency-based analytics.',
        },
        response_type: {
          type: Sequelize.ENUM('rating', 'text', 'boolean', 'numeric'),
          allowNull: false,
          comment: 'Type of response provided, mirroring the question_type at the time of answering.',
        },
        numeric_value: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Numeric value provided when response_type = numeric or derived from rating.',
        },
        boolean_value: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: null,
          comment: 'Boolean response (1 = yes, 0 = no) when response_type = boolean.',
        },
        text_value: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Textual response when response_type = text or additional comment.',
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional additional comment provided by the reviewer (separate from main response).',
        },
        weight: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Snapshot of the question weight at the time of evaluation.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Snapshot of the question position within the section.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible snapshot data (e.g. question text, rating scale label, UI context at the time).',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the response was created.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the response was last modified.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );

    // Unique constraint on (review_id, question_id)
    await queryInterface.addIndex('hr_performance_review_responses', ['review_id', 'question_id'], {
      unique: true,
      name: 'review_question_UN',
    });

    // Individual indexes for foreign keys and other columns
    await queryInterface.addIndex('hr_performance_review_responses', ['review_id'], {
      name: 'idx_hr_perf_responses_review',
    });
    await queryInterface.addIndex('hr_performance_review_responses', ['question_id'], {
      name: 'idx_hr_perf_responses_question',
    });
    await queryInterface.addIndex('hr_performance_review_responses', ['section_id'], {
      name: 'idx_hr_perf_responses_section',
    });
    await queryInterface.addIndex('hr_performance_review_responses', ['rating_scale_level_id'], {
      name: 'idx_hr_perf_responses_rating_level',
    });
    await queryInterface.addIndex('hr_performance_review_responses', ['competency_id'], {
      name: 'idx_hr_perf_responses_competency',
    });

    // Foreign key constraints
    await queryInterface.addConstraint('hr_performance_review_responses', {
      fields: ['review_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_responses_review',
      references: {
        table: 'hr_performance_reviews',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_responses', {
      fields: ['question_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_responses_question',
      references: {
        table: 'hr_performance_review_template_questions',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_responses', {
      fields: ['section_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_responses_section',
      references: {
        table: 'hr_performance_review_template_sections',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_responses', {
      fields: ['rating_scale_level_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_responses_rating_level',
      references: {
        table: 'hr_performance_rating_scale_levels',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_responses', {
      fields: ['competency_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_responses_competency',
      references: {
        table: 'hr_competencies',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_review_responses');
  },
};
