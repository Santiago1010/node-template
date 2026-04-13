'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ai_agents',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique identifier for each agent.',
        },
        slug: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Stable internal identifier used in code (e.g. support-assistant, sales-agent).',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'FK to usr_accounts. Null means the agent is global and available system-wide.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the agent in multiple languages.',
        },
        description: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional description of the agent purpose in multiple languages.',
        },
        agent_type: {
          type: Sequelize.ENUM('assistant', 'task', 'pipeline'),
          allowNull: false,
          comment:
            'Defines the behavioral nature of the agent. assistant: interactive chat. task: single-purpose background execution. pipeline: orchestrates other agents.',
        },
        is_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether the agent is active and available for use.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether the agent is system-defined and protected from modification or deletion.',
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
        comment: 'AI agent identities, global or scoped to an account',
      }
    );

    await queryInterface.addIndex('ai_agents', ['account_id'], {
      name: 'idx_ai_account_id',
    });

    await queryInterface.addConstraint('ai_agents', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_ai_account_id',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ai_agents');
  },
};
