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
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Name of the flag or the country to which it belongs.',
        },
        emoji: {
          type: Sequelize.STRING(5),
          allowNull: false,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Flag emoji.',
        },
        location: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Partial or complete path of the location icon with the flag.',
        },
        flat_2d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Partial or complete path of the flag in its original format, without details.',
        },
        rounded_2d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Partial or complete path of the circular flag format, without additional details.',
        },
        wave_2d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Partial or complete path of the flag with waves, simulating a real flag waving.',
        },
        flat_3d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Partial or complete path of the flag in its original format, with details that make it appear 3D.',
        },
        rounded_3d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment: 'Partial or complete path of the circular flag format, with details that make it appear 3D.',
        },
        wave_3d: {
          type: Sequelize.STRING(100),
          allowNull: true,
          charset: 'utf8mb4',
          collate: 'utf8mb4_general_ci',
          comment:
            'Partial or complete path of the circular flag format, with details that make it appear 3D and simulate a waving flag.',
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
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
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
        comment: 'Table that stores information about country flags.',
      }
    );

    await queryInterface.addIndex('data_flags', ['name'], {
      name: 'flag_name_UN',
      unique: true,
    });

    await queryInterface.addIndex('data_flags', ['location'], {
      name: 'location_UN',
      unique: true,
    });

    await queryInterface.addIndex('data_flags', ['flat_2d'], {
      name: 'flat_2d_UN',
      unique: true,
    });

    await queryInterface.addIndex('data_flags', ['rounded_2d'], {
      name: 'rounded_2d_UN',
      unique: true,
    });

    await queryInterface.addIndex('data_flags', ['wave_2d'], {
      name: 'wave_2d_UN',
      unique: true,
    });

    await queryInterface.addIndex('data_flags', ['flat_3d'], {
      name: 'flat_3d_UN',
      unique: true,
    });

    await queryInterface.addIndex('data_flags', ['wave_3d'], {
      name: 'wave_3d_UN',
      unique: true,
    });

    await queryInterface.addIndex('data_flags', ['rounded_3d'], {
      name: 'rounded_3d_UN',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('data_flags');
  },
};
