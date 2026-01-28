'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_countries',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each country.',
        },
        region_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the region to which the country belongs.',
        },
        capital_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: "ID of the country's capital city.",
        },
        flag_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: "ID of the country's flag.",
        },
        popular_name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the country, written in different languages for internationalization.',
        },
        official_name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Official language of the country translated into several languages.',
        },
        abbreviation: {
          type: Sequelize.JSON,
          allowNull: false,
          comment:
            'ISO 3166-1 alpha-2 two-letter country codes and ISO 3166-1 alpha-3 three-letter country codes of the country.',
        },
        tld: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Internet top level domains',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores the countries.',
      }
    );

    await queryInterface.addIndex('geo_countries', ['region_id'], {
      name: 'region',
    });

    await queryInterface.addIndex('geo_countries', ['capital_id'], {
      name: 'capital',
    });

    await queryInterface.addIndex('geo_countries', ['flag_id'], {
      name: 'flag',
    });

    await queryInterface.addConstraint('geo_countries', {
      fields: ['flag_id'],
      type: 'foreign key',
      name: 'geo_countries_ibfk_3',
      references: {
        table: 'data_flags',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('geo_countries');
  },
};
