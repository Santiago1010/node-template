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

describe('Edge cases and boundary conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('set validation', () => {
    test('throws when ttl is zero', async () => {
      await expect(cache.set('key', 'value', 0)).rejects.toThrow('TTL must be a positive integer');
    });

    test('throws when ttl is negative', async () => {
      await expect(cache.set('key', 'value', -10)).rejects.toThrow('TTL must be a positive integer');
    });

    test('throws when ttl is not an integer', async () => {
      await expect(cache.set('key', 'value', 3.14)).rejects.toThrow('TTL must be a positive integer');
    });
  });

  describe('getOrSet with undefined value', () => {
    test('does not cache when factory returns undefined', async () => {
      redis.get.mockResolvedValue(null);
      redis.setEx.mockResolvedValue('OK');

      const factory = jest.fn().mockResolvedValue(undefined);
      const result = await cache.getOrSet('key', factory, 60);

      expect(result).toBeUndefined();
      expect(redis.setEx).not.toHaveBeenCalled();
    });
  });

  describe('invalidateTag with empty array', () => {
    test('returns 0 when tag has empty array', async () => {
      redis.get.mockResolvedValue(JSON.stringify([]));

      const result = await cache.invalidateTag('empty-tag');

      expect(result).toBe(0);
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('remember with different signatures', () => {
    test('uses DEFAULT_TTL when factory is second parameter', async () => {
      redis.get.mockResolvedValue(null);
      redis.setEx.mockResolvedValue('OK');

      const factory = jest.fn().mockResolvedValue('value');
      await cache.remember('key', factory);

      expect(redis.setEx).toHaveBeenCalledWith('key', 60, 'value');
    });
  });
});
