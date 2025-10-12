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
    MAX_VALUE_SIZE: 100, // Valor pequeño para probar límite
    TAG_PREFIX: 'tag',
    LOCK_PREFIX: 'lock',
    DEFAULT_LOCK_TTL: 30,
  },
}));

const redis = require('../../../../config/cache/redis.config');
const cache = require('../../../../helpers/cache.helper');

describe('Error handling coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set - value size validation', () => {
    test('throws when value exceeds MAX_VALUE_SIZE', async () => {
      // Crear un valor que exceda el límite de 100 caracteres
      const largeValue = 'x'.repeat(150);

      await expect(cache.set('key', largeValue, 60)).rejects.toThrow('Value exceeds maximum size');

      expect(redis.setEx).not.toHaveBeenCalled();
    });

    test('throws when serialized object exceeds MAX_VALUE_SIZE', async () => {
      const largeObject = {
        data: 'x'.repeat(150),
        nested: { more: 'data' },
      };

      await expect(cache.set('key', largeObject, 60)).rejects.toThrow('Value exceeds maximum size');
    });
  });

  describe('exists - error handling', () => {
    test('logs and throws error when redis.exists fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.exists.mockRejectedValue(new Error('Redis connection failed'));

      await expect(cache.exists('key')).rejects.toThrow('Redis connection failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache exists error',
        expect.objectContaining({
          keys: 'key',
          error: 'Redis connection failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('ttl - error handling', () => {
    test('logs and throws error when redis.ttl fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.ttl.mockRejectedValue(new Error('TTL operation failed'));

      await expect(cache.ttl('key')).rejects.toThrow('TTL operation failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache TTL error',
        expect.objectContaining({
          key: 'key',
          error: 'TTL operation failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getOrSet - error handling', () => {
    test('logs and throws error when factory fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.get.mockResolvedValue(null); // cache miss

      const failingFactory = jest.fn().mockRejectedValue(new Error('Factory failed'));

      await expect(cache.getOrSet('key', failingFactory, 60)).rejects.toThrow('Factory failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache getOrSet error',
        expect.objectContaining({
          key: 'key',
          error: 'Factory failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('mget - error handling', () => {
    test('logs and throws error when redis operations fail', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.get.mockRejectedValue(new Error('Get failed'));

      await expect(cache.mget(['key1', 'key2'])).rejects.toThrow('Get failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache mget error',
        expect.objectContaining({
          keys: ['key1', 'key2'],
          error: 'Get failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('mset - error handling', () => {
    test('logs and throws error when any set operation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.setEx.mockRejectedValue(new Error('SetEx failed'));

      await expect(cache.mset({ key1: 'value1', key2: 'value2' }, 60)).rejects.toThrow('SetEx failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache mset error',
        expect.objectContaining({
          error: 'SetEx failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('tagKey - error handling', () => {
    test('logs and throws error when tagging operations fail', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.get.mockRejectedValue(new Error('Tag get failed'));

      await expect(cache.tagKey('key', ['tag1', 'tag2'], 60)).rejects.toThrow('Tag get failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache tag key error',
        expect.objectContaining({
          key: 'key',
          tags: ['tag1', 'tag2'],
          error: 'Tag get failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('invalidateTag - error handling', () => {
    test('logs and throws error when invalidation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.get.mockRejectedValue(new Error('Get tag failed'));

      await expect(cache.invalidateTag('tag1')).rejects.toThrow('Get tag failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache invalidate tag error',
        expect.objectContaining({
          tag: 'tag1',
          error: 'Get tag failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('increment - error handling', () => {
    test('logs and throws error when increment operation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      redis.get.mockRejectedValue(new Error('Get for increment failed'));

      await expect(cache.increment('counter', 1)).rejects.toThrow('Get for increment failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cache increment error',
        expect.objectContaining({
          key: 'counter',
          error: 'Get for increment failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('withLock - callback error handling', () => {
    test('releases lock even when callback throws error', async () => {
      redis.exists.mockResolvedValue(0); // lock available

      let capturedLockValue = null;
      redis.setEx.mockImplementation((_, __, value) => {
        capturedLockValue = value;
        return Promise.resolve('OK');
      });

      redis.get.mockImplementation(() => Promise.resolve(capturedLockValue));
      redis.del.mockResolvedValue(1);

      const failingCallback = jest.fn().mockRejectedValue(new Error('Callback error'));

      await expect(cache.withLock('resource', failingCallback, 30)).rejects.toThrow('Callback error');

      // Verificar que unlock fue llamado a pesar del error
      expect(redis.get).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
      expect(failingCallback).toHaveBeenCalled();
    });
  });
});
