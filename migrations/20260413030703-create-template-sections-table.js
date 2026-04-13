'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_review_template_sections',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each template section.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the section within a template (e.g. COMPETENCIES, OBJECTIVES).',
        },
        template_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_review_templates. Template this section belongs to.',
        },
        rating_scale_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to hr_performance_rating_scales. Defines which rating scale applies to this section.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the section in multiple languages.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional explanation of what this section evaluates.',
        },
        is_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this section must be completed before submitting the review.',
        },
        allow_comments: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether textual feedback is allowed or required in this section.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. custom rules, UI hints, conditional visibility).',
        },
        weight: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Relative weight of this section in overall scoring (e.g. 40.00 means 40%). Null if not used.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: 'Defines the order of the section within the template (1 = first).',
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

    // Unique composite constraint on (template_id, code)
    await queryInterface.addIndex('hr_performance_review_template_sections', ['template_id', 'code'], {
      unique: true,
      name: 'uq_hr_perf_template_sections_template_code',
    });

    await queryInterface.addIndex('hr_performance_review_template_sections', ['template_id'], {
      name: 'idx_hr_perf_template_sections_template',
    });
    await queryInterface.addIndex('hr_performance_review_template_sections', ['rating_scale_id'], {
      name: 'idx_hr_perf_template_sections_rating_scale',
    });

    await queryInterface.addConstraint('hr_performance_review_template_sections', {
      fields: ['template_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_sections_template',
      references: {
        table: 'hr_performance_review_templates',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_performance_review_template_sections', {
      fields: ['rating_scale_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_sections_rating_scale',
      references: {
        table: 'hr_performance_rating_scales',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_review_template_sections');
  },
};
