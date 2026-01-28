'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'data_currencies',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each currency.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Official name of the currency in several languages.',
        },
        abbreviation: {
          type: Sequelize.STRING(15),
          allowNull: false,
          unique: 'unique_abbreviation',
          comment: 'Abbreviation for currency.',
        },
        symbol: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Symbol that differentiates the currency.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Currencies of each country.',
      }
    );

    await queryInterface.addConstraint('geo_countries_has_currencies', {
      fields: ['currency_id'],
      type: 'foreign key',
      name: 'geo_countries_has_currencies_ibfk_2',
      references: {
        table: 'data_currencies',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('data_currencies');
  },
};
