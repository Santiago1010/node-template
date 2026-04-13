'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ai_models',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key.',
        },
        slug: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Stable internal identifier for this model (e.g. claude-sonnet-4-6, gpt-4o).',
        },
        provider_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to ai_providers. Provider that owns this model.',
        },
        model_id_external: {
          type: Sequelize.STRING(150),
          allowNull: false,
          comment: 'Exact model identifier sent in API requests (e.g. claude-sonnet-4-6, gpt-4o-2024-08-06).',
        },
        name: {
          type: Sequelize.STRING(150),
          allowNull: false,
          comment: 'Human-readable name for display (e.g. Claude Sonnet 4.6).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional notes about the model capabilities, limitations, or recommended use cases.',
        },
        supports_tools: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the model supports function calling or tool use.',
        },
        supports_vision: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the model accepts image inputs.',
        },
        supports_json_mode: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the model supports structured JSON output mode.',
        },
        is_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this model is available for use. Set to 0 to deprecate without deleting.',
        },
        context_window: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Maximum number of tokens supported in the context window for this model.',
        },
        max_output_tokens: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Maximum number of tokens the model can generate in a single response.',
        },
        input_cost_per_million: {
          type: Sequelize.DECIMAL(12, 6),
          allowNull: true,
          defaultValue: null,
          comment:
            'Cost in USD per one million input tokens. Null if pricing is not publicly available or not applicable.',
        },
        output_cost_per_million: {
          type: Sequelize.DECIMAL(12, 6),
          allowNull: true,
          defaultValue: null,
          comment:
            'Cost in USD per one million output tokens. Null if pricing is not publicly available or not applicable.',
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
        comment: 'Specific AI models per provider with cost structure',
      }
    );

    await queryInterface.addIndex('ai_models', ['provider_id'], {
      name: 'idx_ai_provider_id',
    });

    await queryInterface.addConstraint('ai_models', {
      fields: ['provider_id', 'model_id_external'],
      type: 'unique',
      name: 'uq_ai_provider_id_model_id_external',
    });

    await queryInterface.addConstraint('ai_models', {
      fields: ['provider_id'],
      type: 'foreign key',
      name: 'fk_ai_models_provider_id',
      references: {
        table: 'ai_providers',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ai_models');
  },
};
