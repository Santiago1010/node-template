'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'usr_users_details',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique auto-numerical ID for each record.',
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the user to whom these details belong.',
        },
        birth_cirty_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Birth city ID.',
        },
        residence_city_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Current city of residence.',
        },
        birth_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          comment: "User's date of birth.",
        },
        gender: {
          type: Sequelize.ENUM('M', 'F', 'O', 'N'),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'User gender.',
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
        comment: 'Additional and optional details for each user.',
      }
    );

    await queryInterface.addIndex('usr_users_details', ['user_id'], {
      name: 'user',
    });

    await queryInterface.addIndex('usr_users_details', ['birth_cirty_id'], {
      name: 'birth_city',
    });

    await queryInterface.addIndex('usr_users_details', ['residence_city_id'], {
      name: 'residence_city',
    });

    await queryInterface.addConstraint('usr_users_details', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'usr_users_details_ibfk_1',
      references: {
        table: 'usr_users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('usr_users_details', {
      fields: ['birth_cirty_id'],
      type: 'foreign key',
      name: 'usr_users_details_ibfk_2',
      references: {
        table: 'geo_cities',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'SET NULL',
    });

    await queryInterface.addConstraint('usr_users_details', {
      fields: ['residence_city_id'],
      type: 'foreign key',
      name: 'usr_users_details_ibfk_3',
      references: {
        table: 'geo_cities',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('usr_users_details');
  },
};
