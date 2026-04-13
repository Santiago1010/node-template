'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ai_agent_versions',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key.',
        },
        agent_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to ai_agents. Agent this version belongs to.',
        },
        model_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to ai_models. Model assigned to this version of the agent.',
        },
        version: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Sequential version number within the agent. Starts at 1 and increments with each new version.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates whether this is the currently active version for the agent. Only one version per agent should have this set to 1 at a time.',
        },
        system_prompt: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment:
            'System prompt sent to the model at the start of every session using this version. Null if no system prompt is needed.',
        },
        extra_params: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment:
            'Additional provider-specific parameters not covered by dedicated columns (e.g. stop sequences, frequency penalty).',
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional internal notes explaining what changed in this version and why.',
        },
        temperature: {
          type: Sequelize.DECIMAL(4, 3),
          allowNull: true,
          defaultValue: null,
          comment:
            'Sampling temperature for response generation. Controls randomness. Null means provider default is used.',
        },
        max_tokens: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'Maximum number of tokens allowed in the model response. Null means provider default is used.',
        },
        top_p: {
          type: Sequelize.DECIMAL(4, 3),
          allowNull: true,
          defaultValue: null,
          comment: 'Top-p nucleus sampling parameter. Null means provider default is used.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when this version was created.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Versioned configuration snapshots for each AI agent',
      }
    );

    await queryInterface.addIndex('ai_agent_versions', ['agent_id'], {
      name: 'idx_ai_agent_id',
    });

    await queryInterface.addIndex('ai_agent_versions', ['model_id'], {
      name: 'idx_ai_model_id',
    });

    await queryInterface.addConstraint('ai_agent_versions', {
      fields: ['agent_id', 'version'],
      type: 'unique',
      name: 'uq_ai_agent_id_version',
    });

    await queryInterface.addConstraint('ai_agent_versions', {
      fields: ['agent_id'],
      type: 'foreign key',
      name: 'fk_ai_agent_versions_agent_id',
      references: {
        table: 'ai_agents',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ai_agent_versions', {
      fields: ['model_id'],
      type: 'foreign key',
      name: 'fk_ai_agent_versions_model_id',
      references: {
        table: 'ai_models',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ai_agent_versions');
  },
};
