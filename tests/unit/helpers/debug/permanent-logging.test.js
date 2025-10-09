const { plog, pdir, perror } = require('../../../../helpers/debug.helper');
const { DEBUG_SETTINGS } = require('../../../../utils/constants.util');

describe('Permanent Logging Functions (plog, pdir, perror)', () => {
  // Helper to generate the expected header
  const generateHeader = (title) => {
    const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
    const titleLength = title.length;
    const paddingLength = Math.max(0, lineLength - titleLength - 2);
    const padding = '-'.repeat(Math.floor(paddingLength / 2));
    return `\n${padding} ${title.toUpperCase()} ${padding}\n`;
  };

  // Helper to generate the expected separator
  const generateSeparator = () => {
    const lineLength = DEBUG_SETTINGS.DEFAULT_LINE_LENGTH;
    return `\n${'-'.repeat(lineLength)}\n`;
  };

  describe('when NODE_ENV is NOT test', () => {
    let consoleLogSpy;
    let consoleDirSpy;
    let consoleErrorSpy;
    let originalNodeEnv;

    beforeAll(() => {
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production'; // Set to a non-test environment
    });

    beforeEach(() => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      consoleDirSpy = jest.spyOn(console, 'dir').mockImplementation(() => {});
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleDirSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    describe('plog', () => {
      it('should always log a single message with a header and separator', () => {
        const title = 'Test Plog';
        const message = 'This is a permanent log message.';
        plog(title, message);

        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleLogSpy).toHaveBeenCalledWith(message);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });

      it('should always log multiple messages with a header and separator', () => {
        const title = 'Test Plog Multiple';
        const message1 = 'First message.';
        const message2 = 'Second message.';
        plog(title, message1, message2);

        expect(consoleLogSpy).toHaveBeenCalledTimes(4);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleLogSpy).toHaveBeenCalledWith(message1);
        expect(consoleLogSpy).toHaveBeenCalledWith(message2);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });

      it('should handle objects as arguments for plog', () => {
        const title = 'Test Plog Object';
        const obj = { a: 1, b: 'test' };
        plog(title, obj);

        expect(consoleLogSpy).toHaveBeenCalledTimes(3);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleLogSpy).toHaveBeenCalledWith(obj);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });
    });

    describe('pdir', () => {
      it('should always inspect a single object with a header and separator', () => {
        const title = 'Test Pdir';
        const obj = { key: 'value', nested: { array: [1, 2, 3] } };
        pdir(title, obj);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header and separator
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleDirSpy).toHaveBeenCalledTimes(1);
        expect(consoleDirSpy).toHaveBeenCalledWith(obj, { depth: null });
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });

      it('should always inspect multiple objects with a header and separator', () => {
        const title = 'Test Pdir Multiple';
        const obj1 = { a: 1 };
        const obj2 = { b: 2 };
        pdir(title, obj1, obj2);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header and separator
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleDirSpy).toHaveBeenCalledTimes(2);
        expect(consoleDirSpy).toHaveBeenCalledWith(obj1, { depth: null });
        expect(consoleDirSpy).toHaveBeenCalledWith(obj2, { depth: null });
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });
    });

    describe('perror', () => {
      it('should always log a single error message with a header and separator', () => {
        const title = 'Test Perror';
        const error = new Error('Something went wrong permanently.');
        perror(title, error);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header and separator
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });

      it('should always log multiple error messages with a header and separator', () => {
        const title = 'Test Perror Multiple';
        const error1 = 'Error one.';
        const error2 = { message: 'Error two', code: 500 };
        perror(title, error1, error2);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Header and separator
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error2);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });

      it('should handle no arguments', () => {
        const title = 'Test Perror No Args';
        perror(title);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        expect(consoleLogSpy).toHaveBeenCalledWith(generateHeader(title));
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(generateSeparator());
      });
    });
  });

  describe('when NODE_ENV is test', () => {
    let consoleLogSpy;
    let consoleDirSpy;
    let consoleErrorSpy;
    let originalNodeEnv;

    beforeAll(() => {
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
    });

    beforeEach(() => {
      // Spy on console methods but do NOT mock their implementation
      consoleLogSpy = jest.spyOn(console, 'log');
      consoleDirSpy = jest.spyOn(console, 'dir');
      consoleErrorSpy = jest.spyOn(console, 'error');
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleDirSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('plog should not log anything', () => {
      const title = 'Test Plog';
      const message = 'This is a permanent log message.';
      plog(title, message);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('pdir should not log anything', () => {
      const title = 'Test Pdir';
      const obj = { key: 'value' };
      pdir(title, obj);
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleDirSpy).not.toHaveBeenCalled();
    });

    it('perror should not log anything', () => {
      const title = 'Test Perror';
      const error = new Error('Something went wrong.');
      perror(title, error);
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
