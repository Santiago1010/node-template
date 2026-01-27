'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_cities',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each city.',
        },
        division_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the political division to which the city belongs.',
        },
        timezone_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'ID of the time zone governing the city. This setup allows for different time zones within a country or even a political division.',
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Original name of the city.',
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
        comment: 'Table that stores cities.',
      }
    );

    await queryInterface.addIndex('geo_cities', ['division_id'], {
      name: 'sub_division',
    });

    await queryInterface.addIndex('geo_cities', ['timezone_id'], {
      name: 'timezone',
    });

    await queryInterface.addConstraint('geo_cities', {
      fields: ['division_id'],
      type: 'foreign key',
      name: 'geo_cities_ibfk_1',
      references: {
        table: 'geo_sub_divisions',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('geo_cities', {
      fields: ['timezone_id'],
      type: 'foreign key',
      name: 'geo_cities_ibfk_2',
      references: {
        table: 'data_timezones',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeConstraint('geo_cities', 'geo_cities_ibfk_1');
    await queryInterface.removeConstraint('geo_cities', 'geo_cities_ibfk_2');

    await queryInterface.dropTable('geo_cities');
  },
};
