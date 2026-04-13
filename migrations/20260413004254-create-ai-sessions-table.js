'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ai_sessions',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for the session.',
        },
        agent_version_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to ai_agent_versions. Exact agent version active when this session was created.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to usr_accounts. Account that owns this session. Null for system-initiated sessions.',
        },
        parent_session_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
          comment: 'Self-referencing FK. Links a child session to its parent in pipeline or multi-agent flows.',
        },
        status: {
          type: Sequelize.ENUM('active', 'completed', 'failed', 'cancelled'),
          allowNull: false,
          defaultValue: 'active',
          comment:
            'Current lifecycle state of the session. active: ongoing. completed: finished successfully. failed: ended with an unrecoverable error. cancelled: manually stopped.',
        },
        session_type: {
          type: Sequelize.ENUM('chat', 'task', 'pipeline'),
          allowNull: false,
          comment:
            'Nature of the session, aligned with the agent type. chat: interactive. task: background execution. pipeline: multi-agent orchestration.',
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
          comment:
            'Optional human-readable title for the session. Can be auto-generated from the first message or set manually.',
        },
        context: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Shared memory or contextual data available to the agent during this session. Used to persist state between messages.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Flexible field for business-specific data tied to this session (e.g. order_id, ticket_id, source channel).',
        },
        total_input_tokens: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Cumulative input tokens consumed across all messages in this session.',
        },
        total_output_tokens: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: 'Cumulative output tokens generated across all messages in this session.',
        },
        total_cost_usd: {
          type: Sequelize.DECIMAL(12, 6),
          allowNull: false,
          defaultValue: 0.0,
          comment: 'Cumulative estimated cost in USD for all messages in this session.',
        },
        started_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Date and time when the session became active. Null if not yet started.',
        },
        ended_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
          comment: 'Date and time when the session reached a terminal state (completed, failed, cancelled).',
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
        comment: 'Groups all messages within a single agent execution',
      }
    );

    await queryInterface.addIndex('ai_sessions', ['agent_version_id'], {
      name: 'idx_ai_agent_version_id',
    });

    await queryInterface.addIndex('ai_sessions', ['account_id'], {
      name: 'idx_ai_account_id',
    });

    await queryInterface.addIndex('ai_sessions', ['parent_session_id'], {
      name: 'idx_ai_parent_session_id',
    });

    await queryInterface.addConstraint('ai_sessions', {
      fields: ['agent_version_id'],
      type: 'foreign key',
      name: 'fk_ai_sessions_agent_version_id',
      references: {
        table: 'ai_agent_versions',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_sessions', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_ai_sessions_account_id',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_sessions', {
      fields: ['parent_session_id'],
      type: 'foreign key',
      name: 'fk_ai_sessions_parent_session_id',
      references: {
        table: 'ai_sessions',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ai_sessions');
  },
};
