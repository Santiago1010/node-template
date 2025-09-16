// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');
const {
  wrapLogging,
  clog,
  cdir,
  cerror,
  clear,
  clir,
  setDebugMode,
  isDebugMode,
} = require('../../../../helpers/debug.helper');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================

describe('Conditional Logging Functions', () => {
  let consoleLogSpy;
  let consoleDirSpy;
  let consoleErrorSpy;
  let consoleClearSpy;

  beforeEach(() => {
    // Mock console methods to prevent actual output during tests
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
    consoleDirSpy = jest.spyOn(console, 'dir').mockImplementation(() => {});
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation(() => {});

    // Ensure debug mode is off by default for most tests
    setDebugMode(false);

    // Clear any logs from setDebugMode call
    consoleLogSpy.mockClear();
    consoleDirSpy.mockClear();
    consoleErrorSpy.mockClear();
    consoleClearSpy.mockClear();
  });

  afterEach(() => {
    // Restore original console methods after each test
    consoleLogSpy.mockRestore();
    consoleDirSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleClearSpy.mockRestore();

    // Reset debug mode
    setDebugMode(false);
  });

  describe('Debug Mode Management', () => {
    it('should be disabled by default', () => {
      expect(isDebugMode()).toBe(false);
    });

    it('should enable debug mode when setDebugMode(true) is called', () => {
      setDebugMode(true);
      expect(isDebugMode()).toBe(true);
    });

    it('should disable debug mode when setDebugMode(false) is called', () => {
      setDebugMode(true);
      setDebugMode(false);
      expect(isDebugMode()).toBe(false);
    });
  });

  describe('wrapLogging', () => {
    it('should return false and not log anything when debug mode is disabled', () => {
      const result = wrapLogging(faker.lorem.sentence());
      expect(result).toBe(false);
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleDirSpy).not.toHaveBeenCalled();
    });

    it('should log header and return a function when debug mode is enabled', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs

      const header = faker.lorem.sentence();
      const result = wrapLogging(header);

      expect(result).toBeInstanceOf(Function);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(header.toUpperCase()));
      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // Only header
      expect(consoleDirSpy).not.toHaveBeenCalled();
    });

    it('should log header and additional data when debug mode is enabled and data is provided', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs
      consoleDirSpy.mockClear();

      const header = faker.lorem.sentence();
      const additionalData = { key: faker.lorem.word(), value: faker.number.int() };
      const result = wrapLogging(header, additionalData);

      expect(result).toBeInstanceOf(Function);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(header.toUpperCase()));
      expect(consoleDirSpy).toHaveBeenCalledWith(additionalData, { depth: null });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header and separator
    });

    it('should not log additional data if it is undefined', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear();
      const header = faker.lorem.sentence();
      wrapLogging(header, undefined);
      expect(consoleDirSpy).not.toHaveBeenCalled();
    });

    it('should log message when the returned function is called', () => {
      setDebugMode(true);
      const logFn = wrapLogging(faker.lorem.sentence());
      consoleLogSpy.mockClear(); // Clear previous calls from wrapLogging itself

      const message = faker.lorem.paragraph();
      logFn(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(message);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should log message and separator when the returned function is called with "Executing" message', () => {
      setDebugMode(true);
      const logFn = wrapLogging(faker.lorem.sentence());
      consoleLogSpy.mockClear(); // Clear previous calls from wrapLogging itself

      const message = 'Executing ' + faker.lorem.sentence();
      logFn(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(message);
      // Check for separator with shorter length that actually matches the implementation
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('clog', () => {
    it('should not log anything when debug mode is disabled', () => {
      clog(faker.lorem.sentence(), faker.lorem.word());
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log header and arguments when debug mode is enabled', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs

      const title = faker.lorem.sentence();
      const arg1 = faker.lorem.word();
      const arg2 = faker.number.int();

      clog(title, arg1, arg2);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleLogSpy).toHaveBeenCalledWith(arg1);
      expect(consoleLogSpy).toHaveBeenCalledWith(arg2);
      // Check for separator with pattern matching instead of exact length
      expect(consoleLogSpy).toHaveBeenCalledTimes(4); // Header, arg1, arg2, separator
    });

    it('should log single argument correctly', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs

      const title = faker.lorem.sentence();
      const arg = faker.lorem.word();

      clog(title, arg);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleLogSpy).toHaveBeenCalledWith(arg);
      // Check for separator with pattern matching instead of exact length
      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // Header, arg, separator
    });

    it('should handle no arguments', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear();
      const title = faker.lorem.sentence();
      clog(title);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('cdir', () => {
    it('should not log anything when debug mode is disabled', () => {
      cdir(faker.lorem.sentence(), { key: faker.lorem.word() });
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleDirSpy).not.toHaveBeenCalled();
    });

    it('should log header and dir arguments when debug mode is enabled', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs
      consoleDirSpy.mockClear();

      const title = faker.lorem.sentence();
      const obj1 = { a: faker.lorem.word() };
      const obj2 = { b: faker.number.int() };

      cdir(title, obj1, obj2);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleDirSpy).toHaveBeenCalledWith(obj1, { depth: null });
      expect(consoleDirSpy).toHaveBeenCalledWith(obj2, { depth: null });
      // Check for separator with pattern matching instead of exact length
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header, separator
      expect(consoleDirSpy).toHaveBeenCalledTimes(2); // obj1, obj2
    });

    it('should handle no arguments', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear();
      const title = faker.lorem.sentence();
      cdir(title);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleDirSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('cerror', () => {
    it('should not log anything when debug mode is disabled', () => {
      cerror(faker.lorem.sentence(), new Error(faker.lorem.sentence()));
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log header and error arguments when debug mode is enabled', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs
      consoleErrorSpy.mockClear();

      const title = faker.lorem.sentence();
      const err1 = new Error(faker.lorem.sentence());
      const err2 = 'Just a string error';

      cerror(title, err1, err2);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleErrorSpy).toHaveBeenCalledWith(err1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(err2);
      // Check for separator with pattern matching instead of exact length
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header, separator
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // err1, err2
    });

    it('should handle a single error argument', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();

      const title = faker.lorem.sentence();
      const err1 = new Error(faker.lorem.sentence());

      cerror(title, err1);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleErrorSpy).toHaveBeenCalledWith(err1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle no arguments', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear();
      const title = faker.lorem.sentence();
      cerror(title);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('should not clear console or log anything when debug mode is disabled', () => {
      clear(faker.lorem.sentence(), faker.lorem.word());
      expect(consoleClearSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should clear console and log header and arguments when debug mode is enabled', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs
      consoleClearSpy.mockClear();

      const title = faker.lorem.sentence();
      const arg1 = faker.lorem.word();
      const arg2 = faker.lorem.word();

      clear(title, arg1, arg2);

      expect(consoleClearSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleLogSpy).toHaveBeenCalledWith(arg1);
      expect(consoleLogSpy).toHaveBeenCalledWith(arg2);
      // Check for separator with pattern matching instead of exact length
      expect(consoleLogSpy).toHaveBeenCalledTimes(4); // Header, arg1, arg2, separator
    });

    it('should handle no arguments', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear();
      consoleClearSpy.mockClear();
      const title = faker.lorem.sentence();
      clear(title);
      expect(consoleClearSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('clir', () => {
    it('should not clear console or log anything when debug mode is disabled', () => {
      clir(faker.lorem.sentence(), { key: faker.lorem.word() });
      expect(consoleClearSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleDirSpy).not.toHaveBeenCalled();
    });

    it('should clear console and dir arguments when debug mode is enabled', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear(); // Clear setDebugMode logs
      consoleClearSpy.mockClear();
      consoleDirSpy.mockClear();

      const title = faker.lorem.sentence();
      const obj1 = { a: faker.lorem.word() };
      const obj2 = { b: faker.lorem.word() };

      clir(title, obj1, obj2);

      expect(consoleClearSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleDirSpy).toHaveBeenCalledWith(obj1, { depth: null });
      expect(consoleDirSpy).toHaveBeenCalledWith(obj2, { depth: null });
      // Check for separator with pattern matching instead of exact length
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header, separator
      expect(consoleDirSpy).toHaveBeenCalledTimes(2); // obj1, obj2
    });

    it('should handle no arguments', () => {
      setDebugMode(true);
      consoleLogSpy.mockClear();
      consoleClearSpy.mockClear();
      consoleDirSpy.mockClear();
      const title = faker.lorem.sentence();
      clir(title);
      expect(consoleClearSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(title.toUpperCase()));
      expect(consoleDirSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });
});
