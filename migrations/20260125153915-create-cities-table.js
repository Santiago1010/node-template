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
        sub_division_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the subdivision to which the city belongs.',
        },
        timezone_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'ID of the time zone governing the city. This setup allows for different time zones within a country or even a subdivision.',
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Original name of the city.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores cities.',
      }
    );

    await queryInterface.addIndex('geo_cities', ['sub_division_id'], {
      name: 'sub_division',
    });

    await queryInterface.addIndex('geo_cities', ['timezone_id'], {
      name: 'timezone',
    });

    await queryInterface.addConstraint('geo_cities', {
      fields: ['sub_division_id'],
      type: 'foreign key',
      name: 'geo_cities_ibfk_1',
      references: {
        table: 'geo_political_divisions',
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
    await queryInterface.dropTable('geo_cities');
  },
};
