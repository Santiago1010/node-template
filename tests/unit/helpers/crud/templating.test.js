const CrudHelper = require('../../../../helpers/crud.helper');

describe('Crud Helper - Templating', () => {
  let crudHelper;

  beforeEach(() => {
    crudHelper = new CrudHelper();
  });

  describe('setCrudName', () => {
    it('should replace method names in a template', () => {
      const template = `
        static async create() {}
        static async readAll() {}
        static async readOne() {}
        static async update() {}
        static async updateStatus() {}
        static async delete() {}

        someObject.create();
        someObject.readAll();
        someObject.readOne();
        someObject.update();
        someObject.updateStatus();
        someObject.delete();

        await logsCreation.create();
        await logsUpdate.create();
        await logsDeletion.create();
      `;

      const expected = `
        static async createUser() {}
        static async readAllUsers() {}
        static async readOneUser() {}
        static async updateUser() {}
        static async updateUsersStatus() {}
        static async deleteUser() {}

        someObject.createUser();
        someObject.readAllUsers();
        someObject.readOneUser();
        someObject.updateUser();
        someObject.updateUsersStatus();
        someObject.deleteUser();

        await logsCreation.create();
        await logsUpdate.create();
        await logsDeletion.create();
      `;

      const result = crudHelper.setCrudName(template, 'users', 'user');
      // Normalize whitespace for comparison
      expect(result.replace(/\s+/g, ' ')).toBe(expected.replace(/\s+/g, ' '));
    });
  });

  describe('generateMethodNames', () => {
    it('should generate correct method names', () => {
      const singularName = 'user';
      const pluralName = 'users';
      const expectedMethods = {
        create: 'createUser',
        updateStatus: 'updateUsersStatus',
        list: 'getListUsers',
        details: 'getUserDetails',
        update: 'updateUser',
        delete: 'deleteUser',
      };

      const methodNames = crudHelper.generateMethodNames(singularName, pluralName);
      expect(methodNames).toEqual(expectedMethods);
    });
  });

  describe('shouldBeTinyInt', () => {
    it('should return false if columnType is not tinyint(1)', () => {
      expect(crudHelper.shouldBeTinyInt('any_column', 'varchar(255)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('any_column', null)).toBe(false);
      expect(crudHelper.shouldBeTinyInt('any_column', undefined)).toBe(false);
    });

    it('should return false for boolean-like names', () => {
      expect(crudHelper.shouldBeTinyInt('is_active', 'tinyint(1)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('has_permissions', 'tinyint(1)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('role_has', 'tinyint(1)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('require_approval', 'tinyint(1)')).toBe(false);
    });

    it('should return true for non-boolean-like names', () => {
      expect(crudHelper.shouldBeTinyInt('status', 'tinyint(1)')).toBe(true);
      expect(crudHelper.shouldBeTinyInt('level', 'tinyint(1)')).toBe(true);
    });

    it('should be case-insensitive for columnType', () => {
      expect(crudHelper.shouldBeTinyInt('is_admin', 'TINYINT(1)')).toBe(false);
    });

    it('should be case-insensitive for columnName', () => {
      expect(crudHelper.shouldBeTinyInt('IS_ACTIVE', 'tinyint(1)')).toBe(false);
      expect(crudHelper.shouldBeTinyInt('Status', 'tinyint(1)')).toBe(true);
    });
  });

  describe('extractPrefixInfo', () => {
    it('should extract prefix information from table name with known prefix', () => {
      // Asumiendo que PREFIXES tiene una entrada como: { USR: 'users' }
      const result = crudHelper.extractPrefixInfo('usr_profiles');

      expect(result.prefix).toBe('usr');
      expect(result.pluralName).toBe('profiles');
      expect(result.groupName).toBeDefined();
      expect(result.tagName).toBeDefined();
    });

    it('should handle table name with unknown prefix', () => {
      const result = crudHelper.extractPrefixInfo('xyz_unknown_table');

      expect(result.prefix).toBe('xyz');
      expect(result.groupName).toBe('general');
      expect(result.pluralName).toBe('unknownTable');
    });

    it('should handle multi-word table names', () => {
      const result = crudHelper.extractPrefixInfo('app_user_settings');

      expect(result.prefix).toBe('app');
      expect(result.pluralName).toBe('userSettings');
    });
  });

  describe('shouldSkipField', () => {
    it('should return true for standard timestamp fields', () => {
      expect(crudHelper.shouldSkipField('created_at')).toBe(true);
      expect(crudHelper.shouldSkipField('updated_at')).toBe(true);
      expect(crudHelper.shouldSkipField('deleted_at')).toBe(true);
    });

    it('should return true for camelCase timestamp fields', () => {
      expect(crudHelper.shouldSkipField('createdAt')).toBe(true);
      expect(crudHelper.shouldSkipField('updatedAt')).toBe(true);
      expect(crudHelper.shouldSkipField('deletedAt')).toBe(true);
    });

    it('should return true for id field', () => {
      expect(crudHelper.shouldSkipField('id')).toBe(true);
    });

    it('should return false for regular fields', () => {
      expect(crudHelper.shouldSkipField('name')).toBe(false);
      expect(crudHelper.shouldSkipField('email')).toBe(false);
      expect(crudHelper.shouldSkipField('user_id')).toBe(false);
    });
  });

  describe('isForeignKey', () => {
    it('should return true for columns ending with _id', () => {
      const result = crudHelper.isForeignKey('user_id', {});
      expect(result).toBe(true);
    });

    it('should return true for columns with MUL key constraint', () => {
      const result = crudHelper.isForeignKey('custom_column', { COLUMN_KEY: 'MUL' });
      expect(result).toBe(true);
    });

    it('should return true for columns with lowercase mul key constraint', () => {
      const result = crudHelper.isForeignKey('custom_column', { COLUMN_KEY: 'mul' });
      expect(result).toBe(true);
    });

    it('should return false for regular columns', () => {
      const result = crudHelper.isForeignKey('name', { COLUMN_KEY: 'UNI' });
      expect(result).toBe(false);
    });

    it('should return false for columns without key constraint', () => {
      const result = crudHelper.isForeignKey('description', {});
      expect(result).toBe(false);
    });
  });

  describe('formatColumns', () => {
    it('should format columns correctly', () => {
      const input = [{ COLUMN_NAME: 'user_id' }, { COLUMN_NAME: 'first_name' }, { COLUMN_NAME: 'last_name' }];

      const result = crudHelper.formatColumns(input);

      expect(result.columns).toEqual(['user_id', 'first_name', 'last_name']);
      expect(result.formatedColumns).toEqual(['userId', 'firstName', 'lastName']);
    });

    it('should remove duplicates', () => {
      const input = [{ COLUMN_NAME: 'user_id' }, { COLUMN_NAME: 'user_id' }, { COLUMN_NAME: 'name' }];

      const result = crudHelper.formatColumns(input);

      expect(result.columns).toEqual(['user_id', 'name']);
      expect(result.formatedColumns).toEqual(['userId', 'name']);
    });

    it('should handle empty array', () => {
      const result = crudHelper.formatColumns([]);

      expect(result.columns).toEqual([]);
      expect(result.formatedColumns).toEqual([]);
    });
  });
});
