'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_review_cycles',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each performance review cycle.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Unique business identifier for the cycle (e.g. PRC-2025-ANNUAL, PRC-2026-Q1). Used for integrations and reporting.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment:
            'Display name of the cycle in multiple languages (e.g. {"en": "Annual Review 2025", "es": "Evaluación Anual 2025"}).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment:
            'Optional explanation of the cycle purpose, scope, or special rules (e.g. includes 360 feedback, applies only to corporate staff).',
        },
        status: {
          type: Sequelize.ENUM('draft', 'active', 'closed', 'archived'),
          allowNull: false,
          defaultValue: 'draft',
          comment:
            'Lifecycle state of the cycle. draft: configurable, active: in progress, closed: completed and locked, archived: historical only.',
        },
        allow_self_review: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether employees can evaluate themselves in this cycle (1 = yes, 0 = no).',
        },
        allow_manager_review: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether direct managers must evaluate employees in this cycle.',
        },
        allow_peer_review: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether peer (360) evaluations are enabled in this cycle.',
        },
        allow_upward_review: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether employees can evaluate their managers (upward feedback).',
        },
        is_mandatory: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether participation in this cycle is mandatory for assigned employees.',
        },
        calibration_required: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether calibration (normalization of scores across managers) is required before closing the cycle.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible field to store additional configuration such as weighting rules, custom deadlines, or company-specific parameters.',
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Start date of the evaluation cycle. Defines when evaluations can begin.',
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'End date of the evaluation cycle. Defines the deadline for completing evaluations.',
        },
        evaluation_period_start: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment:
            'Start date of the performance period being evaluated (e.g. Jan 1). This may differ from the execution window.',
        },
        evaluation_period_end: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'End date of the performance period being evaluated (e.g. Dec 31).',
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
        comment: 'Performance review cycles definition.',
      }
    );

    await queryInterface.addIndex('hr_performance_review_cycles', ['code'], {
      unique: true,
      name: 'uq_hr_performance_review_cycles_code',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_review_cycles');
  },
};
