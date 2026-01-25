'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'data_languages',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: 'Unique primary key for identifying each language.',
        },
        falg_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
          comment: 'ID of the flag that will be displayed alongside the language.',
        },
        abbreviation: {
          type: Sequelize.STRING(10),
          allowNull: false,
          comment: 'Language abbreviation, typically used for internationalization libraries.',
        },
        version: {
          type: Sequelize.STRING(4),
          allowNull: true,
          defaultValue: null,
          comment:
            'Version of the language for different parts of the world that speak the same language. This is completely optional.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Name of the language, written in multiple languages for internationalization.',
        },
        description: {
          type: Sequelize.JSON,
          allowNull: true,
          comment:
            'Explanatory description of the language, provided in English as it is the standard in software development.',
        },
        orientation: {
          type: Sequelize.ENUM('L2R', 'R2L', 'T2BL2R', 'T2BR2L'),
          allowNull: false,
          defaultValue: 'L2R',
          comment:
            'The language can have different writing orientations: left-to-right (L2R), right-to-left (R2L), top-to-bottom with left-to-right direction (T2BL2R), or top-to-bottom with right-to-left direction (T2BR2L).',
        },
        is_public: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this is a selectable language to change the platform language.',
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
        comment: 'Table that stores the languages and their available versions.',
      }
    );

    await queryInterface.addIndex('data_languages', ['flag_id'], {
      name: 'flag',
    });

    await queryInterface.addConstraint('data_languages', {
      fields: ['flag_id'],
      type: 'foreign key',
      name: 'data_languages_ibfk_1',
      references: {
        table: 'data_flags',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('data_languages');
  },
};
