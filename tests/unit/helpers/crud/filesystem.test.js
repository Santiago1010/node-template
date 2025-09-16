const fs = require('fs');
const path = require('path');
const CrudHelper = require('../../../../helpers/crud.helper');
const { PATHS } = require('../../../../helpers/constants.helper');

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'), // import and retain default behavior
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdirSync: jest.fn(),
  existsSync: jest.fn(),
}));

describe('Crud Helper - Filesystem Operations', () => {
  let crudHelper;

  beforeEach(() => {
    crudHelper = new CrudHelper();
    fs.readFile.mockClear();
    fs.writeFile.mockClear();
    fs.mkdirSync.mockClear();
    fs.existsSync.mockClear();
  });

  describe('getTemplate', () => {
    it('should read and return a template file', async () => {
      const templateContent = 'template content';
      fs.readFile.mockImplementation((_, __, callback) => callback(null, templateContent));
      const content = await crudHelper.getTemplate('folder', 'name');
      expect(content).toBe(templateContent);
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(PATHS.TEMPLATES, 'folder', 'name.template.js'),
        'utf-8',
        expect.any(Function)
      );
    });

    it('should throw an error if reading fails', async () => {
      const errorMessage = 'read error';
      fs.readFile.mockImplementation((_, __, callback) => callback(new Error(errorMessage)));
      await expect(crudHelper.getTemplate('folder', 'name')).rejects.toThrow(errorMessage);
    });
  });

  describe('createFolder', () => {
    it('should create a folder if it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      const folderPath = path.join(PATHS.CONTROLLERS, 'group', 'name');
      await crudHelper.createFolder('CONTROLLERS', 'group', 'name');
      expect(fs.mkdirSync).toHaveBeenCalledWith(folderPath, { recursive: true });
    });

    it('should not create a folder if it exists', async () => {
      fs.existsSync.mockReturnValue(true);
      await crudHelper.createFolder('CONTROLLERS', 'group', 'name');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should throw an error if mkdirSync fails', async () => {
      fs.existsSync.mockReturnValue(false);
      const errorMessage = 'mkdir error';
      fs.mkdirSync.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });
      await expect(crudHelper.createFolder('CONTROLLERS', 'group', 'name')).rejects.toThrow(errorMessage);
    });
  });

  describe('createModelsFolder', () => {
    it('should create a models folder', async () => {
      fs.existsSync.mockReturnValue(false);
      const folderPath = path.join('sync_models', 'group');
      await crudHelper.createModelsFolder('group');
      expect(fs.mkdirSync).toHaveBeenCalledWith(folderPath, { recursive: true });
    });
  });

  describe('createFile', () => {
    it('should create a file if it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      fs.writeFile.mockImplementation((_, __, ___, callback) => callback(null));
      const filePath = path.join('folderPath', 'name.js');
      await crudHelper.createFile('folderPath', 'name', 'content');
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, 'content', 'utf-8', expect.any(Function));
    });

    it('should not create a file if it exists', async () => {
      fs.existsSync.mockReturnValue(true);
      await crudHelper.createFile('folderPath', 'name', 'content');
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should throw an error if writeFile fails', async () => {
      fs.existsSync.mockReturnValue(false);
      const errorMessage = 'write error';
      fs.writeFile.mockImplementation((_, __, ___, callback) => callback(new Error(errorMessage)));
      await expect(crudHelper.createFile('folderPath', 'name', 'content')).rejects.toThrow(errorMessage);
    });
  });

  describe('createModelsFile', () => {
    it('should create a model file', async () => {
      fs.writeFile.mockImplementation((_, __, ___, callback) => callback(null));
      const filePath = path.join('folderPath', 'name.model.js');
      await crudHelper.createModelsFile('folderPath', 'name', 'content');
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, 'content', 'utf-8', expect.any(Function));
    });
  });
});
