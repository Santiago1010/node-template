describe('CrudHelper Constructor', () => {
  it('should throw an error if sequelize connection is not available', () => {
    jest.doMock('../../../../config/database/connection', () => null);
    jest.resetModules();
    const CrudHelper = require('../../../../helpers/crud.helper');
    expect(() => new CrudHelper()).toThrow('Database connection is not properly configured');
  });
});
