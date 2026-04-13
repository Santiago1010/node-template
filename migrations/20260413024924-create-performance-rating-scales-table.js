'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_rating_scales',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each rating scale.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the scale (e.g. SCALE-1-5, SCALE-A-D).',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the scale in multiple languages.',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional explanation of how this scale should be used.',
        },
        scale_type: {
          type: Sequelize.ENUM('numeric', 'categorical'),
          allowNull: false,
          comment:
            'Defines the nature of the scale. numeric: ordered numeric values. categorical: labeled levels without strict numeric meaning.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this scale is available for use.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this scale is system-defined and protected from deletion.',
        },
        allow_decimals: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether decimal values are allowed (e.g. 4.5). Only applies to numeric scales.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. default mapping to percentages, color coding, UI hints).',
        },
        min_value: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Minimum numeric value allowed in this scale (e.g. 1.00). Null for categorical scales.',
        },
        max_value: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Maximum numeric value allowed in this scale (e.g. 5.00). Null for categorical scales.',
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
        collate: 'utf8mb4_0900_ai_ci',
        comment: 'Performance rating scales catalog.',
      }
    );

    await queryInterface.addIndex('hr_performance_rating_scales', ['code'], {
      unique: true,
      name: 'uq_hr_performance_rating_scales_code',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_rating_scales');
  },
};
