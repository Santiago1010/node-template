'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'hr_employee_identifications',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
          comment: 'Primary key. Unique identifier for each identification record.',
        },
        employee_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          comment: 'FK to hr_employees. Employee to whom this identification belongs.',
        },
        issuing_country_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'FK to core_countries. Country that issued the document.',
        },
        document_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            'Type of identification document (e.g. national_id, passport, tax_id). Should be standardized across the system.',
        },
        document_number: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment:
            'Identification number as issued by the authority. Must be stored exactly as provided (may include letters or symbols).',
        },
        is_primary: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment:
            'Indicates if this is the main identification used for legal and payroll purposes. Only one per employee should be 1.',
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment:
            'Indicates if the document is currently valid for use. 1 = active, 0 = inactive (e.g. expired, replaced).',
        },
        issued_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Date when the document was issued. Optional depending on document type.',
        },
        expiration_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
          defaultValue: null,
          comment: 'Expiration date of the document. NULL if the document does not expire.',
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
        comment: 'Employee identification documents.',
      }
    );

    await queryInterface.addIndex('hr_employee_identifications', ['employee_id', 'document_type', 'document_number'], {
      unique: true,
      name: 'uq_hr_employee_identifications_employee_document',
    });

    await queryInterface.addIndex('hr_employee_identifications', ['employee_id'], {
      name: 'idx_hr_employee_identifications_employee_id',
    });

    await queryInterface.addIndex('hr_employee_identifications', ['document_number'], {
      name: 'idx_hr_employee_identifications_document_number',
    });

    await queryInterface.addIndex('hr_employee_identifications', ['issuing_country_id'], {
      name: 'idx_hr_employee_identifications_issuing_country_id',
    });

    await queryInterface.addConstraint('hr_employee_identifications', {
      fields: ['employee_id'],
      type: 'foreign key',
      name: 'fk_hr_employee_identifications_employee',
      references: {
        table: 'hr_employees',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('hr_employee_identifications', {
      fields: ['issuing_country_id'],
      type: 'foreign key',
      name: 'fk_hr_employee_identifications_country',
      references: {
        table: 'geo_countries',
        field: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('hr_employee_identifications');
  },
};
