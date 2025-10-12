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

const redisClient = require('../../../../config/cache/redis.config');
const cache = require('../../../../helpers/cache.helper');

describe('Basic cache operations', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('get', () => {
    test('returns parsed JSON when value is JSON string', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ x: 1 }));
      const value = await cache.get('key');
      expect(value).toEqual({ x: 1 });
      expect(redisClient.get).toHaveBeenCalledWith('key');
    });

    test('returns raw string when value is not JSON', async () => {
      redisClient.get.mockResolvedValue('plain');
      const value = await cache.get('key');
      expect(value).toBe('plain');
    });

    test('returns null on cache miss', async () => {
      redisClient.get.mockResolvedValue(null);
      const value = await cache.get('key');
      expect(value).toBeNull();
    });
  });
});
