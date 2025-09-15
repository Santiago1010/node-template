const fs = require('fs');
const path = require('path');

describe('Debug Helper', () => {
  const debugFilePath = path.join(__dirname, '../../../../.debug');
  let originalNodeEnv;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    jest.resetModules();
  });

  afterEach(() => {
    if (fs.existsSync(debugFilePath)) {
      fs.unlinkSync(debugFilePath);
    }
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('setDebugMode', () => {
    it('should set the debug mode to true', () => {
      const { setDebugMode, isDebugMode } = require('../../../../helpers/debug.helper');
      setDebugMode(true);
      expect(isDebugMode()).toBe(true);
    });

    it('should set the debug mode to false', () => {
      const { setDebugMode, isDebugMode } = require('../../../../helpers/debug.helper');
      setDebugMode(true);
      setDebugMode(false);
      expect(isDebugMode()).toBe(false);
    });
  });

  describe('isDebugMode', () => {
    it('should return false if debug file does not exist', () => {
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      expect(isDebugMode()).toBe(false);
    });

    it('should return false if timestamp is missing', () => {
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      fs.writeFileSync(debugFilePath, 'true');
      expect(isDebugMode()).toBe(false);
    });

    it('should return false if timestamp is invalid', () => {
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      fs.writeFileSync(debugFilePath, 'true\ninvalid-timestamp');
      expect(isDebugMode()).toBe(false);
    });

    it('should return false if timestamp is expired', () => {
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      const expiredTimestamp = '2020-01-01 12:00:00';
      fs.writeFileSync(debugFilePath, `true\n${expiredTimestamp}`);
      expect(isDebugMode()).toBe(false);
    });

    it('should return true in local environment', () => {
      process.env.NODE_ENV = 'local';
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      expect(isDebugMode()).toBe(true);
    });

    it('should return true in development environment with allowDevMode', () => {
      process.env.NODE_ENV = 'development';
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      expect(isDebugMode(true)).toBe(true);
    });
  });

  describe('isDevelopmentMode', () => {
    it('should return false when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const { isDevelopmentMode } = require('../../../../helpers/debug.helper');
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return true when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const { isDevelopmentMode } = require('../../../../helpers/debug.helper');
      expect(isDevelopmentMode()).toBe(true);
    });

    it('should return false when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      const { isDevelopmentMode } = require('../../../../helpers/debug.helper');
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return true in development environment with allowDevMode', () => {
      process.env.NODE_ENV = 'development';
      const { isDevelopmentMode } = require('../../../../helpers/debug.helper');
      expect(isDevelopmentMode(true)).toBe(true);
    });
  });
});
