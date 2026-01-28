'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_regions',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each region.',
        },
        continent_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the continent to which the region belongs.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the region, written in different languages for internationalization.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores the regions of the continents.',
      }
    );

    await queryInterface.addIndex('geo_regions', ['continent_id'], {
      name: 'continent',
    });

    await queryInterface.addConstraint('geo_regions', {
      fields: ['continent_id'],
      type: 'foreign key',
      name: 'geo_regions_ibfk_1',
      references: {
        table: 'geo_continents',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('geo_countries', {
      fields: ['region_id'],
      type: 'foreign key',
      name: 'geo_countries_ibfk_1',
      references: {
        table: 'geo_regions',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('geo_regions');
  },
};
