'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_countries_has_languages',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each country/language relationship.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Country ID.',
        },
        language_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Language ID.',
        },
        principal: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicate whether it is the main language of the country.',
        },
        created_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created in the table.',
        },
        updated_at: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was last modified.',
        },
        deleted_at: {
          type: 'TIMESTAMP',
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
        comment: 'Relationship between countries and languages.',
      }
    );

    await queryInterface.addIndex('geo_countries_has_languages', ['country_id'], {
      name: 'country',
    });

    await queryInterface.addIndex('geo_countries_has_languages', ['language_id'], {
      name: 'language',
    });

    await queryInterface.addConstraint('geo_countries_has_languages', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'geo_countries_has_languages_ibfk_1',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('geo_countries_has_languages', {
      fields: ['language_id'],
      type: 'foreign key',
      name: 'geo_countries_has_languages_ibfk_2',
      references: {
        table: 'data_languages',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('geo_countries_has_languages');
  },
};
