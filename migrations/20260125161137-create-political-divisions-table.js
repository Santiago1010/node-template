'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_political_divisions',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each political subdivision.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the country to which the subdivision belongs.',
        },
        capital_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'ID of the capital city of the subdivision.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the political division in several languages.',
        },
        denomination: {
          type: Sequelize.TEXT('tiny'),
          allowNull: false,
          comment: 'Definition of the type of subdivision (department, state, or province).',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores the political subdivisions of a country.',
      }
    );

    await queryInterface.addIndex('geo_political_divisions', ['country_id'], {
      name: 'country',
    });

    await queryInterface.addIndex('geo_political_divisions', ['capital_id'], {
      name: 'capital',
    });

    await queryInterface.addConstraint('geo_political_divisions', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'geo_divisions_ibfk_1',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('geo_political_divisions');
  },
};
