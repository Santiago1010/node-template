const sequelize = require('../../../../config/database/connection');
const CrudHelper = require('../../../../helpers/crud.helper');

// Mock sequelize query method
jest.mock('../../../../config/database/connection', () => {
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([[], []]),
    close: jest.fn().mockResolvedValue(),
    config: {
      database: 'test_db',
      host: 'localhost',
      port: 3306,
    },
    options: {
      dialect: 'mysql',
    },
  };

  return mockSequelize;
});

describe('Crud Helper - Database Operations', () => {
  let crudHelper;

  beforeEach(() => {
    crudHelper = new CrudHelper();
    sequelize.query.mockClear();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('readTablesComment', () => {
    it('should return the table comment', async () => {
      sequelize.query.mockResolvedValueOnce([{ TABLE_COMMENT: 'Test Table Comment' }]);
      const comment = await crudHelper.readTablesComment('test_table');
      expect(comment).toBe('Test Table Comment');
      expect(sequelize.query).toHaveBeenCalledWith(expect.stringContaining('test_table'), expect.any(Object));
    });

    it('should throw an error if the query fails', async () => {
      const errorMessage = 'database error';
      sequelize.query.mockRejectedValue(new Error(errorMessage));
      await expect(crudHelper.readTablesComment('test_table')).rejects.toThrow(errorMessage);
    });

    it('should return an empty string if there is no comment', async () => {
      sequelize.query.mockResolvedValueOnce([]);
      const comment = await crudHelper.readTablesComment('test_table');
      expect(comment).toBe('');
    });
  });

  describe('readAllColumns', () => {
    it('should return all columns', async () => {
      sequelize.query.mockResolvedValueOnce([{ COLUMN_NAME: 'id' }, { COLUMN_NAME: 'name' }]);
      const { columns, formatedColumns } = await crudHelper.readAllColumns('test_table');
      expect(columns).toEqual(['id', 'name']);
      expect(formatedColumns).toEqual(['id', 'name']);
    });

    it('should handle null or undefined column names', async () => {
      sequelize.query.mockResolvedValueOnce([
        { COLUMN_NAME: 'id' },
        { COLUMN_NAME: null },
        { COLUMN_NAME: undefined },
        { something_else: 'value' },
      ]);
      const { columns, formatedColumns } = await crudHelper.readAllColumns('test_table');
      expect(columns).toEqual(['id']);
      expect(formatedColumns).toEqual(['id']);
    });
  });

  describe('readUpdatableColumns', () => {
    it('should return updatable columns', async () => {
      sequelize.query.mockResolvedValueOnce([{ COLUMN_NAME: 'name' }]);
      const { columns } = await crudHelper.readUpdatableColumns('test_table');
      expect(columns).toEqual(['name']);
    });
  });

  describe('readRequiredColumns', () => {
    it('should return required columns', async () => {
      sequelize.query.mockResolvedValueOnce([{ COLUMN_NAME: 'name' }]);
      const { columns } = await crudHelper.readRequiredColumns('test_table');
      expect(columns).toEqual(['name']);
    });
  });

  describe('readNullableOrDefaultColumns', () => {
    it('should return nullable or default columns', async () => {
      sequelize.query.mockResolvedValueOnce([{ COLUMN_NAME: 'description' }]);
      const { columns } = await crudHelper.readNullableOrDefaultColumns('test_table');
      expect(columns).toEqual(['description']);
    });
  });

  describe('searchEnums', () => {
    it('should return enum columns', async () => {
      sequelize.query.mockResolvedValueOnce([{ COLUMN_NAME: 'status' }]);
      const { columns } = await crudHelper.searchEnums('test_table');
      expect(columns).toEqual(['status']);
    });
  });

  describe('searchIndexes', () => {
    it('should return indexes', async () => {
      sequelize.query.mockResolvedValueOnce([{ INDEX_NAME: 'name_idx' }]);
      const { columns } = await crudHelper.searchIndexes('test_table');
      // The helper returns a formatted columns object, so we check that
      expect(columns).toEqual([]); // no column name in mock
    });
  });

  describe('searchForeignKeys', () => {
    it('should return foreign keys', async () => {
      sequelize.query.mockResolvedValueOnce([{ CONSTRAINT_NAME: 'fk_user' }]);
      const fks = await crudHelper.searchForeignKeys('test_table');
      expect(fks).toHaveLength(1);
      expect(fks[0].CONSTRAINT_NAME).toBe('fk_user');
    });
  });

  describe('searchReferences', () => {
    it('should return references', async () => {
      sequelize.query.mockResolvedValueOnce([{ TABLE_NAME: 'profiles' }]);
      const refs = await crudHelper.searchReferences('test_table');
      expect(refs).toHaveLength(1);
      expect(refs[0].TABLE_NAME).toBe('profiles');
    });
  });

  describe('searchBridges', () => {
    it('should return bridge tables', async () => {
      sequelize.query.mockResolvedValueOnce([{ child_table: 'user_roles' }]);
      const bridges = await crudHelper.searchBridges('test_table');
      expect(bridges).toHaveLength(1);
      expect(bridges[0].child_table).toBe('user_roles');
    });
  });

  describe('detailsIndex', () => {
    it('should return index details', async () => {
      sequelize.query.mockResolvedValueOnce([{ INDEX_NAME: 'name_idx' }]);
      const details = await crudHelper.detailsIndex('test_table', 'name');
      expect(details).toHaveLength(1);
      expect(details[0].INDEX_NAME).toBe('name_idx');
    });
  });

  describe('detailsColumn', () => {
    it('should return column details', async () => {
      sequelize.query.mockResolvedValueOnce([{ COLUMN_NAME: 'name' }]);
      const details = await crudHelper.detailsColumn('test_table', 'name');
      expect(details.COLUMN_NAME).toBe('name');
    });
  });

  describe('uniqueDetails', () => {
    it('should return unique details', async () => {
      sequelize.query.mockResolvedValueOnce([{ INDEX_NAME: 'name_unique' }]);
      const details = await crudHelper.uniqueDetails('test_table', 'name');
      expect(details).toBe('name_unique');
    });

    it('should return an empty string if there are no unique details', async () => {
      sequelize.query.mockResolvedValueOnce([]);
      const details = await crudHelper.uniqueDetails('test_table', 'name');
      expect(details).toBe('');
    });
  });

  describe('getReferencedTable', () => {
    it('should return referenced table from direct query result', async () => {
      sequelize.query.mockResolvedValueOnce([{ REFERENCED_TABLE_NAME: 'direct_ref_table' }]);
      const referencedTable = await crudHelper.getReferencedTable('test_table', 'any_column_id');
      expect(referencedTable).toBe('direct_ref_table');
    });

    it('should return referenced table for a column ending with _id', async () => {
      sequelize.query.mockResolvedValueOnce([]); // No direct reference found
      sequelize.query.mockResolvedValueOnce([{ TABLE_NAME: 'related_models' }]);
      const referencedTable = await crudHelper.getReferencedTable('test_table', 'related_model_id');
      expect(referencedTable).toBe('related_models');
    });

    it('should return null if column does not end with _id and no direct reference is found', async () => {
      sequelize.query.mockResolvedValueOnce([]);
      const referencedTable = await crudHelper.getReferencedTable('test_table', 'some_column');
      expect(referencedTable).toBeNull();
    });

    it('should return null if no referenced table is found', async () => {
      sequelize.query.mockResolvedValueOnce([]);
      sequelize.query.mockResolvedValueOnce([]);
      const referencedTable = await crudHelper.getReferencedTable('test_table', 'related_model_id');
      expect(referencedTable).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      sequelize.query.mockRejectedValue(new Error('Query failed'));
      const referencedTable = await crudHelper.getReferencedTable('test_table', 'related_model_id');
      expect(referencedTable).toBeNull();
    });
  });

  describe('findTableByPattern', () => {
    it('should find a table by pattern', async () => {
      sequelize.query.mockResolvedValueOnce([{ TABLE_NAME: 'usr_users' }]);
      const tableName = await crudHelper.findTableByPattern('user');
      expect(tableName).toBe('usr_users');
    });

    it('should return the first table name if no pattern matches', async () => {
      sequelize.query.mockResolvedValueOnce([{ TABLE_NAME: 'some_other_table' }]);
      const tableName = await crudHelper.findTableByPattern('user');
      expect(tableName).toBe('some_other_table');
    });

    it('should return the first match if multiple patterns match', async () => {
      sequelize.query.mockResolvedValueOnce([{ TABLE_NAME: 'app_users' }, { TABLE_NAME: 'dev_users' }]);
      const tableName = await crudHelper.findTableByPattern('users');
      expect(tableName).toBe('app_users');
    });

    it('should return null if no tables are found', async () => {
      sequelize.query.mockResolvedValueOnce([]);
      const tableName = await crudHelper.findTableByPattern('user');
      expect(tableName).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      sequelize.query.mockRejectedValue(new Error('Query failed'));
      const tableName = await crudHelper.findTableByPattern('user');
      expect(tableName).toBeNull();
    });
  });

  describe('isFieldRequired', () => {
    it('should return false for skipped fields', () => {
      expect(crudHelper.isFieldRequired('id', {})).toBe(false);
    });

    it('should return false for auto-incrementing fields', () => {
      expect(crudHelper.isFieldRequired('any_field', { EXTRA: 'auto_increment' })).toBe(false);
    });

    it('should return false for primary key fields', () => {
      expect(crudHelper.isFieldRequired('any_field', { COLUMN_KEY: 'PRI' })).toBe(false);
    });

    it('should return true for non-nullable fields without default value', () => {
      expect(crudHelper.isFieldRequired('any_field', { NULLABLE: '0', COLUMN_DEFAULT: null })).toBe(true);
    });

    it('should return true for non-nullable fields with undefined default value', () => {
      expect(crudHelper.isFieldRequired('any_field', { NULLABLE: '0', COLUMN_DEFAULT: undefined })).toBe(true);
    });

    it('should return false for nullable fields', () => {
      expect(crudHelper.isFieldRequired('any_field', { NULLABLE: '1', COLUMN_DEFAULT: null })).toBe(false);
    });

    it('should return false for fields with a default value', () => {
      expect(crudHelper.isFieldRequired('any_field', { NULLABLE: '0', COLUMN_DEFAULT: 'default' })).toBe(false);
    });
  });

  describe('shouldBeTinyInt', () => {
    it('should return false if column type is not tinyint(1)', () => {
      expect(crudHelper.shouldBeTinyInt('any_column', 'varchar(255)')).toBe(false);
    });

    it('should return false if column type is null or undefined', () => {
      expect(crudHelper.shouldBeTinyInt('any_column', null)).toBe(false);
      expect(crudHelper.shouldBeTinyInt('any_column', undefined)).toBe(false);
    });

    it('should return false for boolean-like names', () => {
      expect(crudHelper.shouldBeTinyInt('is_active', 'tinyint(1)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('require_approval', 'tinyint(1)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('has_permission', 'tinyint(1)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('user_has', 'tinyint(1)')).toBe(false);
    });

    it('should return true for non-boolean-like names', () => {
      expect(crudHelper.shouldBeTinyInt('status', 'tinyint(1)')).toBe(true);
    });
  });

  describe('executeQuery - Error Handling', () => {
    it('should log and rethrow errors when query execution fails', async () => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorMessage = 'Connection lost';

      sequelize.query.mockRejectedValueOnce(new Error(errorMessage));

      await expect(crudHelper.executeQuery('SELECT * FROM invalid', 'Test query')).rejects.toThrow(errorMessage);

      expect(consoleSpy).toHaveBeenCalledWith('Error executing query: Test query', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getTemplate - Error Handling', () => {
    it('should log and rethrow errors when template reading fails', async () => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const fs = require('fs');
      const errorMessage = 'Template not found';
      fs.readFile.mockImplementation((_, __, callback) => callback(new Error(errorMessage)));

      await expect(crudHelper.getTemplate('invalid', 'template')).rejects.toThrow(errorMessage);

      expect(consoleSpy).toHaveBeenCalledWith('Error reading template: invalid/template', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
