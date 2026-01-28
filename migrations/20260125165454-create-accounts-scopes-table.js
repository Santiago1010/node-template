'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_accounts_has_scopes',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each relationship between an account and a scope.',
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Account ID.',
        },
        scope_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Scope ID.',
        },
        expires_at: {
          type: 'TIMESTAMP',
          allowNull: true,
          comment:
            'Specifies a date and time limit for the account to be eligible for the scope. If null, this indicates that the account will permanently have that scope.',
        },
        created_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created in the table.',
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was last modified.',
        },
        deleted_at: {
          type: 'TIMESTAMP',
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
        comment: 'Temporary scopes that a specific account can have.',
      }
    );

    await queryInterface.addIndex('usr_accounts_has_scopes', ['account_id'], {
      name: 'account',
    });

    await queryInterface.addIndex('usr_accounts_has_scopes', ['scope_id'], {
      name: 'scope',
    });

    await queryInterface.addConstraint('usr_accounts_has_scopes', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'usr_accounts_has_scopes_ibfk_1',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('usr_accounts_has_scopes', {
      fields: ['scope_id'],
      type: 'foreign key',
      name: 'usr_accounts_has_scopes_ibfk_2',
      references: {
        table: 'config_scopes',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_accounts_has_scopes');
  },
};
