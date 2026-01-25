'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'data_types_identification',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key to identify each type of identification.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'ID of the country to which the identification document belongs.',
        },
        abbreviation: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Abbreviation of the identification document.',
        },
        name: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Official name of the identification document.',
        },
        mask: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Mask of the format in which the identification document is usually displayed, without needing to modify the value.',
        },
        min: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 5,
          comment: 'Minimum expected size of the identification document.',
        },
        max: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValue: 20,
          comment: 'Maximum expected size of the identification document.',
        },
        person_type: {
          type: Sequelize.ENUM('natural', 'legal'),
          allowNull: false,
          comment: 'Indicates whether the identification type is for individuals or companies.',
        },
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        comment: 'Table that stores the types of documents of the countries.',
      }
    );

    await queryInterface.addIndex('data_types_identification', ['country_id', 'abbreviation'], {
      name: 'country_document',
      unique: true,
    });

    await queryInterface.addIndex('data_types_identification', ['country_id'], {
      name: 'country',
    });

    await queryInterface.addConstraint('data_types_identification', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'data_types_identification_ibfk_1',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('data_types_identification');
  },
};
