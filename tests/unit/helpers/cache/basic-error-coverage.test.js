jest.mock('../../../../config/cache/redis.config', () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
}));

jest.mock('../../../../utils/constants.util', () => ({
  CACHE_CONFIG: {
    DEFAULT_TTL: 60,
    MAX_VALUE_SIZE: 1000,
    TAG_PREFIX: 'tag',
    LOCK_PREFIX: 'lock',
    DEFAULT_LOCK_TTL: 30,
  },
}));

const redis = require('../../../../config/cache/redis.config');
const cache = require('../../../../helpers/cache.helper');

describe('Basic operations - error logging coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set - comprehensive error paths', () => {
    test('handles and logs error when setEx fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.setEx.mockRejectedValue(new Error('SetEx failed'));

      await expect(cache.set('key', 'value', 60)).rejects.toThrow('SetEx failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache set error',
        expect.objectContaining({
          key: 'key',
          error: 'SetEx failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('del - error handling', () => {
    test('handles and logs error when del fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.del.mockRejectedValue(new Error('Del failed'));

      await expect(cache.del('key')).rejects.toThrow('Del failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache delete error',
        expect.objectContaining({
          keys: 'key',
          error: 'Del failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('invalidatePattern - error handling', () => {
    test('handles and logs error when keys operation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.keys.mockRejectedValue(new Error('Keys failed'));

      await expect(cache.invalidatePattern('pattern:*')).rejects.toThrow('Keys failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache invalidate pattern error',
        expect.objectContaining({
          pattern: 'pattern:*',
          error: 'Keys failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('lock/unlock - error handling', () => {
    test('lock handles and logs error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.exists.mockRejectedValue(new Error('Exists check failed'));

      await expect(cache.lock('resource')).rejects.toThrow('Exists check failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache lock error',
        expect.objectContaining({
          resource: 'resource',
          error: 'Exists check failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    test('unlock handles and logs error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.get.mockRejectedValue(new Error('Get lock value failed'));

      await expect(cache.unlock('resource', 'lockValue')).rejects.toThrow('Get lock value failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache unlock error',
        expect.objectContaining({
          resource: 'resource',
          error: 'Get lock value failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('flush - error handling', () => {
    test('handles and logs error when flush fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.keys.mockRejectedValue(new Error('Flush keys failed'));

      await expect(cache.flush()).rejects.toThrow('Flush keys failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache flush error',
        expect.objectContaining({
          error: 'Flush keys failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
