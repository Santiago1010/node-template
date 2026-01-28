'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'data_timezones',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each time zone.',
        },
        continent_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment:
            'ID of the continent to which the time zone belongs. This facilitates more efficient filtering of the required time zones.',
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'International name or identifier of the time zone (in "Continent/Zone" format).',
        },
        utc: {
          type: Sequelize.STRING(6),
          allowNull: false,
          comment: 'Coordinated Universal Time (UTC) offset of each time zone.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores time zones.',
      }
    );

    await queryInterface.addIndex('data_timezones', ['continent_id'], {
      name: 'continent',
      comment: 'Continent to which the time zone belongs.',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('data_timezones');
  },
};
