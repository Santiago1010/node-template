'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'data_flags',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each flag.',
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
          comment: 'Name of the flag or the country to which it belongs.',
        },
        emoji: {
          type: Sequelize.STRING(5),
          allowNull: false,
          comment: 'Flag emoji.',
        },
        location: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment: 'Partial or complete path of the location icon with the flag.',
        },
        flat_2d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment: 'Partial or complete path of the flag in its original format, without details.',
        },
        rounded_2d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment: 'Partial or complete path of the circular flag format, without additional details.',
        },
        wave_2d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment: 'Partial or complete path of the flag with waves, simulating a real flag waving.',
        },
        flat_3d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment: 'Partial or complete path of the flag in its original format, with details that make it appear 3D.',
        },
        rounded_3d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Partial or complete path of the circular flag format, with details that make it appear 3D.',
        },
        wave_3d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment:
            'Partial or complete path of the circular flag format, with details that make it appear 3D and simulate a waving flag.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores information about country flags.',
      }
    );

    await queryInterface.addIndex('data_flags', ['rounded_3d'], {
      name: 'rounded_3d',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('data_flags');
  },
};
