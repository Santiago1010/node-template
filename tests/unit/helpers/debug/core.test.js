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

    it('should return a failure message if writing to the debug file fails', () => {
      const debugHelper = require('../../../../helpers/debug.helper');
      const fs = require('fs');

      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = debugHelper.setDebugMode(true);
      expect(result).toContain('Failed to set debug mode: Test error');

      // Restore the original implementation
      fs.writeFileSync.mockRestore();
    });
  });

  describe('isDebugMode', () => {
    it('should return false if debug file does not exist', () => {
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      expect(isDebugMode()).toBe(false);
    });

    it('should return false if reading the debug file fails', () => {
      const fs = require('fs');
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('Read error');
      });
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      expect(isDebugMode()).toBe(false);
      fs.readFileSync.mockRestore();
    });

    it('should return false if timestamp is missing', () => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { isDebugMode } = require('../../../../helpers/debug.helper');
      fs.writeFileSync(debugFilePath, 'true');
      expect(isDebugMode()).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Debug file missing timestamp on second line.');
      consoleWarnSpy.mockRestore();
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

  describe('isTimestampValid', () => {
    const { isTimestampValid } = require('../../../../helpers/debug.helper');

    test('should return false for invalid timestamp', () => {
      const invalidTimestamp = '2022-01-01 12:00:00abc';
      expect(isTimestampValid(invalidTimestamp)).toBe(false);
    });

    test('should return false for expired timestamp', () => {
      const expiredTimestamp = '2021-01-01 12:00:00';
      expect(isTimestampValid(expiredTimestamp)).toBe(false);
    });

    test('should return false for empty timestamp', () => {
      const emptyTimestamp = '';
      expect(isTimestampValid(emptyTimestamp)).toBe(false);
    });

    test('should return false for null timestamp', () => {
      const nullTimestamp = null;
      expect(isTimestampValid(nullTimestamp)).toBe(false);
    });
  });
});
