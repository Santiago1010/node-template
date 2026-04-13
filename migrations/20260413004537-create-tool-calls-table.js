'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ai_tool_calls',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key.',
        },
        session_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to ai_sessions. Session where this tool call occurred. Denormalized for query efficiency.',
        },
        request_message_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to ai_messages. The assistant message that contains the tool call request.',
        },
        result_message_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment:
            'FK to ai_messages. The tool message that contains the result returned to the model. Null until the tool execution completes.',
        },
        tool_name: {
          type: Sequelize.STRING(150),
          allowNull: false,
          comment:
            'Name of the tool invoked, as defined in the agent tool registry (e.g. get_order_status, send_email).',
        },
        arguments: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Arguments passed to the tool by the model, as a JSON object. Null if the tool requires no arguments.',
        },
        result: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Result returned by the tool execution, as a JSON object. Null until execution completes.',
        },
        status: {
          type: Sequelize.ENUM('pending', 'running', 'completed', 'failed'),
          allowNull: false,
          defaultValue: 'pending',
          comment:
            'Current execution state of the tool call. pending: not yet started. running: in progress. completed: finished successfully. failed: execution error.',
        },
        error_message: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Error description if the tool call failed. Null on success.',
        },
        tool_call_id_external: {
          type: Sequelize.STRING(100),
          allowNull: true,
          defaultValue: null,
          comment:
            'Provider-assigned identifier for this tool call within the API response (e.g. call_abc123). Used to match requests and results.',
        },
        latency_ms: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Time in milliseconds between tool invocation and result return. Null if not yet completed.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the tool call was registered.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Records every tool invocation made by an AI agent',
      }
    );

    await queryInterface.addIndex('ai_tool_calls', ['session_id'], {
      name: 'idx_ai_session_id',
    });

    await queryInterface.addIndex('ai_tool_calls', ['request_message_id'], {
      name: 'idx_ai_request_message_id',
    });

    await queryInterface.addIndex('ai_tool_calls', ['result_message_id'], {
      name: 'idx_ai_result_message_id',
    });

    await queryInterface.addConstraint('ai_tool_calls', {
      fields: ['session_id', 'tool_call_id_external'],
      type: 'unique',
      name: 'uq_ai_session_id_tool_call_id_external',
    });

    await queryInterface.addConstraint('ai_tool_calls', {
      fields: ['session_id'],
      type: 'foreign key',
      name: 'fk_ai_tool_calls_session_id',
      references: {
        table: 'ai_sessions',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_tool_calls', {
      fields: ['request_message_id'],
      type: 'foreign key',
      name: 'fk_ai_tool_calls_request_message_id',
      references: {
        table: 'ai_messages',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_tool_calls', {
      fields: ['result_message_id'],
      type: 'foreign key',
      name: 'fk_ai_tool_calls_result_message_id',
      references: {
        table: 'ai_messages',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ai_tool_calls');
  },
};
