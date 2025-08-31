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
});
