'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_continents',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each continent.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Continent name, written in different languages for internationalization.',
        },
        abbreviation: {
          type: Sequelize.STRING(3),
          allowNull: false,
          unique: true,
          comment: 'Continent abbreviation.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores the continents.',
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('geo_continents');
  },
};
