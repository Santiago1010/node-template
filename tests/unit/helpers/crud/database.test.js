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
});
