'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_countries_has_currencies',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each country/currency relationship.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Country ID.',
        },
        currency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Currency ID.',
        },
        example: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Example of how the number is normally displayed in the country.',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was created in the table.',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          comment: 'Date and time when the record was last modified.',
        },
        deleted_at: {
          type: Sequelize.DATE,
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
        comment: 'Relationship between countries and their currencies.',
      }
    );

    await queryInterface.addIndex('geo_countries_has_currencies', ['country_id'], {
      name: 'country',
    });

    await queryInterface.addIndex('geo_countries_has_currencies', ['currency_id'], {
      name: 'currency',
    });

    await queryInterface.addConstraint('geo_countries_has_currencies', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'geo_countries_has_currencies_ibfk_1',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('geo_countries_has_currencies');
  },
};
