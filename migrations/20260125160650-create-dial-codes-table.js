'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'geo_dial_codes',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique identifier for each dialing code.',
        },
        country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Country ID to which the dialing code belongs.',
        },
        code: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Dialing code.',
        },
        mask: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Mask for each number that uses the dialing code.',
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
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
        comment: 'Dialing codes for each country.',
      }
    );

    await queryInterface.addIndex('geo_dial_codes', ['country_id', 'code'], {
      name: 'code',
      unique: true,
    });

    await queryInterface.addIndex('geo_dial_codes', ['country_id'], {
      name: 'country',
    });

    await queryInterface.addConstraint('geo_dial_codes', {
      fields: ['country_id'],
      type: 'foreign key',
      name: 'geo_dial_codes_ibfk_1',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('geo_dial_codes');
  },
};
