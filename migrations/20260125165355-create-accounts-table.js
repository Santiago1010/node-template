'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_accounts',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each account belonging to a user.',
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'User/customer ID associated with the account.',
        },
        rol_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the role that holds the account.',
        },
        dial_code_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Mobile number code ID. Cannot be null if a cell phone number exists.',
        },
        recovery_email: {
          type: Sequelize.STRING(150),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Email account where recovery data will be sent, in case the primary account cannot be accessed.',
        },
        recovery_email_confirmed_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Indicates whether the recovery email has already been confirmed (other than null) or not (null).',
        },
        password: {
          type: Sequelize.STRING(200),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment:
            "Hash of the user's access password. It is encrypted for enhanced security of the user's information.",
        },
        two_factor_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether you have 2-step verification enabled or not.',
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
        comment: "Contains information about a user's account.",
      }
    );

    await queryInterface.addIndex('usr_accounts', ['rol_id'], {
      name: 'rol',
    });

    await queryInterface.addIndex('usr_accounts', ['user_id'], {
      name: 'user',
    });

    await queryInterface.addIndex('usr_accounts', ['dial_code_id'], {
      name: 'dial_code',
    });

    await queryInterface.addConstraint('usr_accounts', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'usr_accounts_ibfk_1',
      references: {
        table: 'usr_users',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });

    await queryInterface.addConstraint('usr_accounts', {
      fields: ['rol_id'],
      type: 'foreign key',
      name: 'usr_accounts_ibfk_2',
      references: {
        table: 'config_roles',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });

    await queryInterface.addConstraint('usr_accounts', {
      fields: ['dial_code_id'],
      type: 'foreign key',
      name: 'usr_accounts_ibfk_3',
      references: {
        table: 'geo_dial_codes',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });

    await queryInterface.addConstraint('usr_accesses', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'usr_accesses_ibfk_1',
      references: {
        table: 'usr_accounts',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_accounts');
  },
};
