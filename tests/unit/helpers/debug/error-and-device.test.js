// =============================================================================
// DEBUG HELPER - ERROR AND DEVICE DETECTION - UNIT TESTS
// =============================================================================

const fs = require('fs');
const path = require('path');
const Boom = require('@hapi/boom');
const {
  registerError,
  createHeader,
  createSeparator,
  detectDeviceType,
  detectDeviceWithMetadata,
} = require('../../../../helpers/debug.helper');

jest.mock('fs');
jest.mock('path');
jest.mock('@hapi/boom', () => ({
  badRequest: jest.fn(),
  unauthorized: jest.fn(),
  forbidden: jest.fn(),
  notFound: jest.fn(),
  conflict: jest.fn(),
  badData: jest.fn(),
  tooManyRequests: jest.fn(),
  internal: jest.fn(),
}));

describe('Debug Helper - Error and Device Detection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Formatting Utilities', () => {
    it('createHeader should create a formatted header', () => {
      const title = 'Test Header';
      const header = createHeader(title, 50);
      expect(header).toContain(title.toUpperCase());
      expect(header.length).toBe(51);
    });

    it('createSeparator should create a separator line', () => {
      const separator = createSeparator(50);
      expect(separator).toBe(`\n${'-'.repeat(50)}\n`);
    });
  });

  describe('Device Detection', () => {
    it('detectDeviceType should detect a web browser', () => {
      const req = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        },
      };
      expect(detectDeviceType(req)).toBe('web_browser');
    });

    it('detectDeviceType should detect a mobile browser', () => {
      const req = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        },
      };
      expect(detectDeviceType(req)).toBe('mobile_browser');
    });

    it('detectDeviceType should detect a smart tv', () => {
      const req = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (SMART-TV; Linux; Tizen 2.4.0) AppleWebkit/538.1 (KHTML, like Gecko) SamsungBrowser/1.1 TV Safari/538.1',
        },
      };
      expect(detectDeviceType(req)).toBe('smart_tv');
    });

    it('detectDeviceType should detect an IoT device', () => {
      const req = { headers: { 'user-agent': 'iot-device/1.0' } };
      expect(detectDeviceType(req)).toBe('iot_device');
    });

    it('detectDeviceType should detect a game console', () => {
      const req = {
        headers: { 'user-agent': 'Mozilla/5.0 (PlayStation 4 5.01) AppleWebKit/602.2.14 (KHTML, like Gecko)' },
      };
      expect(detectDeviceType(req)).toBe('game_console');
    });

    it('detectDeviceType should detect a desktop app', () => {
      const req = { headers: { 'user-agent': 'insomnia/8.6.1' } };
      expect(detectDeviceType(req)).toBe('desktop_app');
    });

    it('detectDeviceWithMetadata should return device metadata', () => {
      const req = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        },
        ip: '127.0.0.1',
      };
      const metadata = detectDeviceWithMetadata(req);
      expect(metadata.type).toBe('mobile_browser');
      expect(metadata.isMobile).toBe(true);
      expect(metadata.isWeb).toBe(true);
    });

    it('detectDeviceWithMetadata should handle missing IP', () => {
      const req = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1',
        },
        connection: {},
      };
      const metadata = detectDeviceWithMetadata(req);
      expect(metadata.ip).toBeUndefined();
    });
  });

  describe('registerError', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
    });

    it('should register an error and return a Boom error object', () => {
      const error = 'Test error';
      const httpCode = 404;
      const location = 'test-location';
      const code = 123;
      const additionalInfo = { foo: 'bar' };

      path.join.mockReturnValue('test/path/to/error.log');

      registerError(error, httpCode, { location, code, additionalInfo });

      expect(fs.appendFileSync).toHaveBeenCalled();
      expect(Boom.notFound).toHaveBeenCalledWith(error);
    });

    it('should handle different http codes', () => {
      registerError('Test error', 400);
      expect(Boom.badRequest).toHaveBeenCalled();

      registerError('Test error', 401);
      expect(Boom.unauthorized).toHaveBeenCalled();

      registerError('Test error', 403);
      expect(Boom.forbidden).toHaveBeenCalled();

      registerError('Test error', 409);
      expect(Boom.conflict).toHaveBeenCalled();

      registerError('Test error', 422);
      expect(Boom.badData).toHaveBeenCalled();

      registerError('Test error', 429);
      expect(Boom.tooManyRequests).toHaveBeenCalled();

      registerError('Test error', 500);
      expect(Boom.internal).toHaveBeenCalled();
    });

    it('should handle serialization error', () => {
      const error = 'Test error';
      const httpCode = 500;
      const circularInfo = {};
      circularInfo.a = circularInfo;

      registerError(error, httpCode, { additionalInfo: circularInfo });

      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    it('should handle file write error', () => {
      const appendFileSyncSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
        throw new Error('File write error');
      });

      expect(() => registerError('Test error', 500)).toThrow('File write error');
      appendFileSyncSpy.mockRestore();
    });

    it('should handle additionalInfo as a string', () => {
      const error = 'Test error';
      const httpCode = 500;
      const additionalInfo = 'some string';

      registerError(error, httpCode, { additionalInfo });

      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    it('should create logs directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      registerError('Test error', 500);
      expect(fs.mkdirSync).toHaveBeenCalled();
    });
  });
});
