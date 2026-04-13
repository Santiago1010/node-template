'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ai_usage_logs',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key.',
        },
        external_request_id: {
          type: Sequelize.STRING(200),
          allowNull: true,
          defaultValue: null,
          unique: true,
          comment:
            'Request ID returned by the provider API for this call. Used for deduplication and cross-referencing with provider dashboards.',
        },
        model_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to ai_models. Model used in this API call.',
        },
        session_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to ai_sessions. Session this call belongs to. Null for system calls outside a session context.',
        },
        message_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to ai_messages. Specific message that triggered this API call. Null for calls not tied to a single message.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to usr_accounts. Account associated with this call. Null for system-initiated calls.',
        },
        call_type: {
          type: Sequelize.ENUM('inference', 'embedding', 'moderation', 'other'),
          allowNull: false,
          defaultValue: 'inference',
          comment:
            'Type of API call made. inference: text generation. embedding: vector generation. moderation: content safety check. other: any provider-specific call.',
        },
        status: {
          type: Sequelize.ENUM('success', 'error'),
          allowNull: false,
          defaultValue: 'success',
          comment:
            'Outcome of the API call. success: provider returned a valid response. error: provider returned an error or call failed.',
        },
        error_code: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Provider error code if the call failed (e.g. rate_limit_exceeded, context_length_exceeded). Null on success.',
        },
        input_tokens: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Number of input tokens reported by the provider for this call.',
        },
        output_tokens: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Number of output tokens reported by the provider for this call.',
        },
        cache_read_tokens: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment:
            'Number of tokens served from the provider prompt cache. Relevant for providers like Anthropic that offer cache pricing.',
        },
        cache_write_tokens: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Number of tokens written to the provider prompt cache in this call.',
        },
        input_cost_usd: {
          type: Sequelize.DECIMAL(12, 6),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Cost in USD for input tokens in this call, calculated at time of call using model pricing.',
        },
        output_cost_usd: {
          type: Sequelize.DECIMAL(12, 6),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Cost in USD for output tokens in this call, calculated at time of call using model pricing.',
        },
        total_cost_usd: {
          type: Sequelize.DECIMAL(12, 6),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Total cost in USD for this call (input_cost_usd + output_cost_usd).',
        },
        latency_ms: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Total round-trip time in milliseconds for this API call.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the API call was made.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Immutable ledger of every AI provider API call made',
      }
    );

    await queryInterface.addIndex('ai_usage_logs', ['model_id'], {
      name: 'idx_ai_usage_logs_model_id',
    });

    await queryInterface.addIndex('ai_usage_logs', ['session_id'], {
      name: 'idx_ai_usage_logs_session_id',
    });

    await queryInterface.addIndex('ai_usage_logs', ['message_id'], {
      name: 'idx_ai_usage_logs_message_id',
    });

    await queryInterface.addIndex('ai_usage_logs', ['account_id'], {
      name: 'idx_ai_usage_logs_account_id',
    });

    await queryInterface.addConstraint('ai_usage_logs', {
      fields: ['model_id'],
      type: 'foreign key',
      name: 'fk_ai_usage_logs_model_id',
      references: {
        table: 'ai_models',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_usage_logs', {
      fields: ['session_id'],
      type: 'foreign key',
      name: 'fk_ai_usage_logs_session_id',
      references: {
        table: 'ai_sessions',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_usage_logs', {
      fields: ['message_id'],
      type: 'foreign key',
      name: 'fk_ai_usage_logs_message_id',
      references: {
        table: 'ai_messages',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_usage_logs', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_ai_usage_logs_account_id',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ai_usage_logs');
  },
};
