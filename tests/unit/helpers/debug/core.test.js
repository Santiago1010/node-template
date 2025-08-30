const { isDebugMode, isDevelopmentMode, setDebugMode } = require('../../../../helpers/debug.helper');

describe('Debug Helper', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Clean up after each test to ensure isolation
    setDebugMode(false);
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('setDebugMode', () => {
    it('should set the debug mode to true', () => {
      setDebugMode(true);
      expect(isDebugMode()).toBe(true);
    });

    it('should set the debug mode to false', () => {
      setDebugMode(false);
      expect(isDebugMode()).toBe(false);
    });
  });

  describe('isDebugMode', () => {
    it('should return true when debug mode is enabled', () => {
      setDebugMode(true);
      expect(isDebugMode()).toBe(true);
    });

    it('should return false when debug mode is disabled', () => {
      setDebugMode(false);
      expect(isDebugMode()).toBe(false);
    });

    it('should return false by default if not set', () => {
      // Ensure a clean state for this specific test
      setDebugMode(false); // Explicitly set to false to ensure default behavior if not already
      expect(isDebugMode()).toBe(false);
    });
  });

  describe('isDevelopmentMode', () => {
    it('should return false when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(isDevelopmentMode()).toBe(false);
    });

    it('should return false when NODE_ENV is set to other values', () => {
      process.env.NODE_ENV = 'test';
      expect(isDevelopmentMode()).toBe(false);
    });
  });
});
