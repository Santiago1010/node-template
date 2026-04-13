'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ai_providers',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Unique and auto-numbering key for each AI provider.',
        },
        slug: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'Stable internal identifier used in code (e.g. anthropic, openai, google).',
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Display name of the provider (e.g. Anthropic, OpenAI, Google).',
        },
        base_url: {
          type: Sequelize.STRING(300),
          allowNull: true,
          defaultValue: null,
          comment: 'Base API URL used to reach the provider. Null if managed via SDK without explicit URL.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional notes about the provider, its capabilities, or usage constraints.',
        },
        is_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether the provider is active and available for use in the system.',
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
        comment: 'Catalog of AI providers available in the system',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('ai_providers');
  },
};
