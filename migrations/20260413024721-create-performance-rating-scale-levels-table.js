'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_performance_rating_scale_levels',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each scale level.',
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Unique business identifier for the level within a scale (e.g. LEVEL-1, EXCELLENT).',
        },
        rating_scale_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_performance_rating_scales. Scale this level belongs to.',
        },
        name: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Display name of the level in multiple languages (e.g. {"en":"Excellent","es":"Excelente"}).',
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: null,
          comment: 'Optional explanation of what this level represents in behavioral or performance terms.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Indicates whether this level is currently usable.',
        },
        is_system: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indicates whether this level is system-defined and protected from deletion.',
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: null,
          comment: 'Flexible configuration (e.g. percentage mapping, color codes, behavioral anchors).',
        },
        numeric_value: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: null,
          comment: 'Numeric value associated with this level (e.g. 1.00–5.00). Null for purely categorical scales.',
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: 'Order of the level within the scale (1 = lowest or first).',
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
        comment: 'Performance rating scale levels.',
      }
    );

    await queryInterface.addIndex('hr_performance_rating_scale_levels', ['rating_scale_id', 'code'], {
      unique: true,
      name: 'uq_hr_performance_rating_scale_levels_scale_code',
    });

    await queryInterface.addIndex('hr_performance_rating_scale_levels', ['rating_scale_id'], {
      name: 'idx_hr_performance_rating_scale_levels_scale_id',
    });

    await queryInterface.addConstraint('hr_performance_rating_scale_levels', {
      fields: ['rating_scale_id'],
      type: 'foreign key',
      name: 'fk_hr_perf_scale_levels_scale',
      references: {
        table: 'hr_performance_rating_scales',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_performance_rating_scale_levels');
  },
};
