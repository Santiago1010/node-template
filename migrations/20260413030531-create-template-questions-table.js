'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_review_template_questions',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each question.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the question within a section (e.g. Q-LEADERSHIP-01).',
        },
        section_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_review_template_sections. Section this question belongs to.',
        },
        rating_scale_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_performance_rating_scales. Required when question_type = rating.',
        },
        competency_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_competencies. Links this question to a competency being evaluated.',
        },
        question_text: {
          type: Sequelize.JSON,
          allowNull: false,
          comment:
            'Question text in multiple languages (e.g. {"en":"Demonstrates leadership","es":"Demuestra liderazgo"}).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional guidance explaining how the question should be interpreted by evaluators.',
        },
        question_type: {
          type: Sequelize.ENUM('rating', 'text', 'boolean', 'numeric'),
          allowNull: false,
          comment:
            'Defines the expected response type. rating: uses rating scale, text: open feedback, boolean: yes/no, numeric: free numeric input.',
        },
        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this question must be answered before submission.',
        },
        allow_comments: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether additional textual comments are allowed alongside the response.',
        },
        objective_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this question must be answered in the context of a specific objective (OKR-style evaluations).',
        },
        weight: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Relative weight of this question within its section. Null means no weighting applied.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: 'Order of the question within the section (1 = first).',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. conditional visibility, validation rules, UI hints).',
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

    await queryInterface.addIndex('hr_performance_review_template_questions', ['section_id', 'code'], {
      unique: true,
      name: 'code_UN',
    });

    await queryInterface.addIndex('hr_performance_review_template_questions', ['section_id'], {
      name: 'idx_hr_perf_template_questions_section',
    });
    await queryInterface.addIndex('hr_performance_review_template_questions', ['rating_scale_id'], {
      name: 'idx_hr_perf_template_questions_rating_scale',
    });
    await queryInterface.addIndex('hr_performance_review_template_questions', ['competency_id'], {
      name: 'idx_hr_perf_template_questions_competency',
    });

    await queryInterface.addConstraint('hr_performance_review_template_questions', {
      fields: ['section_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_questions_section',
      references: {
        table: 'hr_performance_review_template_sections',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_template_questions', {
      fields: ['rating_scale_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_questions_rating_scale',
      references: {
        table: 'hr_performance_rating_scales',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_template_questions', {
      fields: ['competency_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_questions_competency',
      references: {
        table: 'hr_competencies',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_review_template_questions');
  },
};
