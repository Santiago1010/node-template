// =============================================================================
// CACHE HELPER - UNIT TESTS
// =============================================================================

const cacheHelper = require('../../../../helpers/cache.helper');
const redisClient = require('../../../../config/cache/redisClient');
const { CACHE_CONFIG } = require('../../../../helpers/constants.helper');

// Mock the redisClient
jest.mock('../../../../config/cache/redisClient', () => ({
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  client: {
    multi: jest.fn().mockReturnThis(),
    sMembers: jest.fn(),
    eval: jest.fn(),
    flushDb: jest.fn(),
    set: jest.fn(),
    exec: jest.fn(),
  },
  healthCheck: jest.fn(),
}));

describe('Cache Helper', () => {
  let originalConsoleError;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });
  afterEach(() => {
    jest.clearAllMocks();
    cacheHelper.resetMetrics();
  });

  describe('get', () => {
    it('should get a value from cache', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ data: 'test-value' }));
      const value = await cacheHelper.get('test-key');
      expect(value).toBe('test-value');
      expect(redisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null if key not found', async () => {
      redisClient.get.mockResolvedValue(null);
      const value = await cacheHelper.get('test-key');
      expect(value).toBeNull();
    });

    it('should return null if redisClient.get rejects', async () => {
      redisClient.get.mockRejectedValue(new Error('Redis error'));
      const value = await cacheHelper.get('test-key');
      expect(value).toBeNull();
    });

    it('should deserialize null value', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ __null: true, __type: 'object' }));
      const value = await cacheHelper.get('test-key');
      expect(value).toBeNull();
    });

    it('should deserialize undefined value', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ __null: true, __type: 'undefined' }));
      const value = await cacheHelper.get('test-key');
      expect(value).toBeUndefined();
    });

    it('should deserialize string value', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ __string: true, data: 'a-string-value' }));
      const value = await cacheHelper.get('test-key');
      expect(value).toBe('a-string-value');
    });

    it('should return raw string if deserialization fails', async () => {
      redisClient.get.mockResolvedValue('invalid-json-string');
      const value = await cacheHelper.get('test-key');
      expect(value).toBe('invalid-json-string');
    });

    it('should deserialize plain object value', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ data: { key: 'value' } }));
      const value = await cacheHelper.get('test-key');
      expect(value).toEqual({ key: 'value' });
    });

    // Test cases for validateKey
    it('should return null for invalid key (null)', async () => {
      const value = await cacheHelper.get(null);
      expect(value).toBeNull();
    });

    it('should return null for invalid key (empty string)', async () => {
      const value = await cacheHelper.get('');
      expect(value).toBeNull();
    });

    it('should return null for invalid key (non-string)', async () => {
      const value = await cacheHelper.get(123);
      expect(value).toBeNull();
    });

    it('should return null for key exceeding max length', async () => {
      const longKey = 'a'.repeat(CACHE_CONFIG.MAX_KEY_LENGTH + 1);
      const value = await cacheHelper.get(longKey);
      expect(value).toBeNull();
    });

    it('should return null for key containing whitespace', async () => {
      const value = await cacheHelper.get('key with space');
      expect(value).toBeNull();
    });
  });

  describe('set', () => {
    it('should set a value in cache with TTL', async () => {
      redisClient.setEx.mockResolvedValue('OK');
      const result = await cacheHelper.set('test-key', 'test-value', 60);
      expect(result).toBe(true);
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        60,
        JSON.stringify({ __string: true, data: 'test-value' })
      );
    });

    it('should set a value in cache without TTL', async () => {
      redisClient.set.mockResolvedValue('OK');
      const result = await cacheHelper.set('test-key', 'test-value', 0);
      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledWith('test-key', JSON.stringify({ __string: true, data: 'test-value' }));
    });

    it('should set a null value in cache', async () => {
      redisClient.set.mockResolvedValue('OK');
      const result = await cacheHelper.set('test-key', null, 0);
      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledWith('test-key', JSON.stringify({ __null: true, __type: 'object' }));
    });

    it('should set an undefined value in cache', async () => {
      redisClient.set.mockResolvedValue('OK');
      const result = await cacheHelper.set('test-key', undefined, 0);
      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledWith('test-key', JSON.stringify({ __null: true, __type: 'undefined' }));
    });

    it('should set a string value in cache', async () => {
      redisClient.set.mockResolvedValue('OK');
      const result = await cacheHelper.set('test-key', 'just-a-string', 0);
      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ __string: true, data: 'just-a-string' })
      );
    });

    it('should set and get a plain string value', async () => {
      redisClient.set.mockResolvedValue('OK');
      redisClient.get.mockResolvedValue(JSON.stringify({ __string: true, data: 'plain-string' }));

      const setResult = await cacheHelper.set('string-key', 'plain-string', 0);
      expect(setResult).toBe(true);

      const getResult = await cacheHelper.get('string-key');
      expect(getResult).toBe('plain-string');
    });

    it('should return false if redisClient.setEx rejects', async () => {
      redisClient.setEx.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.set('test-key', 'test-value', 60);
      expect(result).toBe(false);
    });

    it('should return false if redisClient.set rejects', async () => {
      redisClient.set.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.set('test-key', 'test-value', 0);
      expect(result).toBe(false);
    });

    it('should return false if value exceeds maximum size', async () => {
      const originalMaxSize = CACHE_CONFIG.MAX_VALUE_SIZE;
      CACHE_CONFIG.MAX_VALUE_SIZE = 10; // Temporarily set a small max size
      const largeValue = 'a'.repeat(100);
      const result = await cacheHelper.set('test-key', largeValue);
      expect(result).toBe(false);
      CACHE_CONFIG.MAX_VALUE_SIZE = originalMaxSize; // Restore original max size
    });
  });

  describe('delete', () => {
    it('should delete a single key', async () => {
      redisClient.del.mockResolvedValue(1);
      const result = await cacheHelper.delete('test-key');
      expect(result).toBe(1);
      expect(redisClient.del).toHaveBeenCalledWith(['test-key']);
    });

    it('should delete multiple keys', async () => {
      redisClient.del.mockResolvedValue(2);
      const result = await cacheHelper.delete(['key1', 'key2']);
      expect(result).toBe(2);
      expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should return 0 if redisClient.del rejects', async () => {
      redisClient.del.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.delete('test-key');
      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      redisClient.exists.mockResolvedValue(1);
      const result = await cacheHelper.exists('test-key');
      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      redisClient.exists.mockResolvedValue(0);
      const result = await cacheHelper.exists('test-key');
      expect(result).toBe(false);
    });

    it('should return false if redisClient.exists rejects', async () => {
      redisClient.exists.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.exists('test-key');
      expect(result).toBe(false);
    });
  });

  describe('getTTL', () => {
    it('should get TTL for a key', async () => {
      redisClient.ttl.mockResolvedValue(60);
      const result = await cacheHelper.getTTL('test-key');
      expect(result).toBe(60);
    });

    it('should return -2 if redisClient.ttl rejects', async () => {
      redisClient.ttl.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.getTTL('test-key');
      expect(result).toBe(-2);
    });
  });

  describe('getMany', () => {
    it('should get multiple values', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.get = jest.fn().mockReturnThis();
      redisClient.client.exec.mockResolvedValue([
        [null, JSON.stringify({ data: 'value1' })],
        [null, JSON.stringify({ data: 'value2' })],
      ]);
      const result = await cacheHelper.getMany(['key1', 'key2']);
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should return an empty object if redisClient.client.exec rejects', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.get = jest.fn().mockReturnThis();
      redisClient.client.exec.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.getMany(['key1', 'key2']);
      expect(result).toEqual({});
    });

    it('should handle invalid JSON in getMany', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.get = jest.fn().mockReturnThis();
      redisClient.client.exec.mockResolvedValue([
        [null, 'invalid-json'],
        [null, JSON.stringify({ data: 'value2' })],
      ]);
      const result = await cacheHelper.getMany(['key1', 'key2']);
      expect(result).toEqual({ key1: 'invalid-json', key2: 'value2' });
    });

    it('should return empty object for empty keys array', async () => {
      const result = await cacheHelper.getMany([]);
      expect(result).toEqual({});
    });

    it('should return empty object for non-array keys input', async () => {
      const result = await cacheHelper.getMany(null);
      expect(result).toEqual({});
    });

    it('should handle errors for individual keys in getMany', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.get = jest.fn().mockReturnThis();
      redisClient.client.exec.mockResolvedValue([
        [new Error('Key1 error'), null],
        [null, JSON.stringify({ data: 'value2' })],
      ]);
      const result = await cacheHelper.getMany(['key1', 'key2']);
      expect(result).toEqual({ key1: null, key2: 'value2' });
    });

    it('should handle null values for individual keys in getMany', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.get = jest.fn().mockReturnThis();
      redisClient.client.exec.mockResolvedValue([
        [null, null],
        [null, JSON.stringify({ data: 'value2' })],
      ]);
      const result = await cacheHelper.getMany(['key1', 'key2']);
      expect(result).toEqual({ key1: null, key2: 'value2' });
    });
  });

  describe('setMany', () => {
    it('should set multiple values', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.setEx = jest.fn().mockReturnThis();
      redisClient.client.exec.mockResolvedValue([
        [null, 'OK'],
        [null, 'OK'],
      ]);
      const result = await cacheHelper.setMany({ key1: 'value1', key2: 'value2' });
      expect(result).toBe(true);
    });

    it('should return false if redisClient.client.exec rejects', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.setEx = jest.fn().mockReturnThis();
      redisClient.client.exec.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.setMany({ key1: 'value1', key2: 'value2' });
      expect(result).toBe(false);
    });

    it('should return false for non-object keyValuePairs input', async () => {
      const resultNull = await cacheHelper.setMany(null);
      expect(resultNull).toBe(false);
      const resultString = await cacheHelper.setMany('string');
      expect(resultString).toBe(false);
      const resultNumber = await cacheHelper.setMany(123);
      expect(resultNumber).toBe(false);
    });

    it('should return true for empty keyValuePairs object', async () => {
      const result = await cacheHelper.setMany({});
      expect(result).toBe(true);
    });

    it('should return false if one of the values exceeds maximum size', async () => {
      const originalMaxSize = CACHE_CONFIG.MAX_VALUE_SIZE;
      CACHE_CONFIG.MAX_VALUE_SIZE = 10; // Temporarily set a small max size
      const largeValue = 'a'.repeat(100);
      const result = await cacheHelper.setMany({ key1: 'small', key2: largeValue });
      expect(result).toBe(false);
      CACHE_CONFIG.MAX_VALUE_SIZE = originalMaxSize; // Restore original max size
    });

    it('should return false if some set operations fail in setMany', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.setEx = jest.fn().mockReturnThis();
      redisClient.client.exec.mockResolvedValue([
        [null, 'OK'],
        [new Error('Set error'), null],
      ]);
      const result = await cacheHelper.setMany({ key1: 'value1', key2: 'value2' });
      expect(result).toBe(false);
    });

    it('should set and get multiple string values', async () => {
      // Mock for setMany operation
      redisClient.client.multi.mockReturnThis();
      redisClient.client.setEx.mockReturnThis();
      redisClient.client.exec.mockResolvedValueOnce([
        [null, 'OK'],
        [null, 'OK'],
      ]);

      const setResult = await cacheHelper.setMany({ key1: 'string1', key2: 'string2' });
      expect(setResult).toBe(true);

      // Mock for getMany operation
      redisClient.client.multi.mockReturnThis();
      redisClient.client.get.mockReturnThis();
      redisClient.client.exec.mockResolvedValueOnce([
        [null, JSON.stringify({ __string: true, data: 'string1' })],
        [null, JSON.stringify({ __string: true, data: 'string2' })],
      ]);

      const getResult = await cacheHelper.getMany(['key1', 'key2']);
      expect(getResult).toEqual({ key1: 'string1', key2: 'string2' });
    });
  });

  describe('getOrSet', () => {
    it('should get value from cache if it exists', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ data: 'cached-value' }));
      const fetcher = jest.fn();
      const result = await cacheHelper.getOrSet('test-key', fetcher);
      expect(result).toBe('cached-value');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and set value if not in cache', async () => {
      redisClient.get.mockResolvedValue(null);
      redisClient.setEx.mockResolvedValue('OK');
      const fetcher = jest.fn().mockResolvedValue('fetched-value');
      const result = await cacheHelper.getOrSet('test-key', fetcher, 60);
      expect(result).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalled();
      expect(redisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        60,
        JSON.stringify({ __string: true, data: 'fetched-value' })
      );
    });

    it('should return fetched value if redisClient.get rejects in getOrSet', async () => {
      redisClient.get.mockRejectedValue(new Error('Redis error'));
      const fetcher = jest.fn().mockResolvedValue('fetched-value');
      const result = await cacheHelper.getOrSet('test-key', fetcher, 60);
      expect(result).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalled(); // fetcher should be called if get fails
    });

    it('should return null if fetcher rejects in getOrSet', async () => {
      const originalError = console.error;
      console.error = jest.fn(); // Mock console.error

      redisClient.get.mockResolvedValue(null);
      const fetcher = jest.fn().mockRejectedValue(new Error('Fetcher error'));
      const result = await cacheHelper.getOrSet('test-key', fetcher, 60);
      expect(result).toBeNull();
      expect(fetcher).toHaveBeenCalled();

      console.error = originalError; // Restore console.error
    });

    it('should return fetched value even if set fails in getOrSet', async () => {
      redisClient.get.mockResolvedValue(null);
      redisClient.setEx.mockRejectedValue(new Error('Redis set error'));
      const fetcher = jest.fn().mockResolvedValue('fetched-value');
      const result = await cacheHelper.getOrSet('test-key', fetcher, 60);
      expect(result).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalled();
    });

    it('should return null if fetchFunction is not a function', async () => {
      const resultNull = await cacheHelper.getOrSet('test-key', null);
      expect(resultNull).toBeNull();
      const resultString = await cacheHelper.getOrSet('test-key', 'not-a-function');
      expect(resultString).toBeNull();
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys by pattern', async () => {
      redisClient.keys.mockResolvedValue(['user:1', 'user:2']);
      redisClient.del.mockResolvedValue(2);
      const result = await cacheHelper.invalidatePattern('user:*');
      expect(result).toBe(2);
      expect(redisClient.keys).toHaveBeenCalledWith('user:*');
      expect(redisClient.del).toHaveBeenCalledWith(['user:1', 'user:2']);
    });

    it('should return 0 if redisClient.keys rejects', async () => {
      redisClient.keys.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.invalidatePattern('user:*');
      expect(result).toBe(0);
    });

    it('should return 0 if redisClient.del rejects during invalidatePattern', async () => {
      redisClient.keys.mockResolvedValue(['user:1', 'user:2']);
      redisClient.del.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.invalidatePattern('user:*');
      expect(result).toBe(0);
    });

    it('should return 0 if no keys match the pattern', async () => {
      redisClient.keys.mockResolvedValue([]);
      const result = await cacheHelper.invalidatePattern('user:*');
      expect(result).toBe(0);
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('tag', () => {
    it('should tag a key', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.sAdd = jest.fn().mockReturnThis();
      redisClient.client.expire = jest.fn().mockReturnThis();
      redisClient.client.exec.mockResolvedValue([]);
      const result = await cacheHelper.tag('test-key', 'tag1');
      expect(result).toBe(true);
    });

    it('should return false if redisClient.client.exec rejects during tag', async () => {
      redisClient.client.multi = jest.fn().mockReturnThis();
      redisClient.client.sAdd = jest.fn().mockReturnThis();
      redisClient.client.expire = jest.fn().mockReturnThis();
      redisClient.client.exec.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.tag('test-key', 'tag1');
      expect(result).toBe(false);
    });
  });

  describe('invalidateByTag', () => {
    it('should invalidate keys by tag', async () => {
      redisClient.client.sMembers.mockResolvedValue(['key1', 'key2']);
      redisClient.del.mockResolvedValue(2);
      const result = await cacheHelper.invalidateByTag('tag1');
      expect(result).toBe(2);
      expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should return 0 if redisClient.client.sMembers rejects', async () => {
      redisClient.client.sMembers.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.invalidateByTag('tag1');
      expect(result).toBe(0);
    });

    it('should return 0 if redisClient.del rejects during invalidateByTag', async () => {
      redisClient.client.sMembers.mockResolvedValue(['key1', 'key2']);
      redisClient.del.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.invalidateByTag('tag1');
      expect(result).toBe(0);
    });

    it('should return 0 if no keys are associated with the tag', async () => {
      redisClient.client.sMembers.mockResolvedValue([]);
      const result = await cacheHelper.invalidateByTag('tag1');
      expect(result).toBe(0);
      expect(redisClient.del).toHaveBeenCalledWith(['tag:tag1']);
    });
  });

  describe('acquireLock', () => {
    it('should acquire a lock', async () => {
      redisClient.client.set.mockResolvedValue('OK');
      const token = await cacheHelper.acquireLock('lock-key');
      expect(token).toBeDefined();
    });

    it('should return null if redisClient.client.set rejects during acquireLock', async () => {
      redisClient.client.set.mockRejectedValue(new Error('Redis error'));
      const token = await cacheHelper.acquireLock('lock-key');
      expect(token).toBeNull();
    });

    it('should return null if lock is already acquired', async () => {
      redisClient.client.set.mockResolvedValue(null);
      const token = await cacheHelper.acquireLock('lock-key');
      expect(token).toBeNull();
    });
  });

  describe('releaseLock', () => {
    it('should release a lock', async () => {
      redisClient.client.eval.mockResolvedValue(1);
      const result = await cacheHelper.releaseLock('lock-key', 'lock-token');
      expect(result).toBe(true);
    });

    it('should return false if redisClient.client.eval rejects during releaseLock', async () => {
      redisClient.client.eval.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.releaseLock('lock-key', 'lock-token');
      expect(result).toBe(false);
    });

    it('should return false if lock is not held by this token', async () => {
      redisClient.client.eval.mockResolvedValue(0);
      const result = await cacheHelper.releaseLock('lock-key', 'lock-token');
      expect(result).toBe(false);
    });
  });

  describe('metrics', () => {
    it('should get and reset metrics', () => {
      const metrics = cacheHelper.getMetrics();
      expect(metrics.hits).toBe(0);
      cacheHelper.resetMetrics();
      const newMetrics = cacheHelper.getMetrics();
      expect(newMetrics.hits).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should perform a health check', async () => {
      redisClient.healthCheck.mockResolvedValue({ status: 'ok' });
      const health = await cacheHelper.healthCheck();
      expect(health.status).toBe('ok');
    });

    it('should return status error if healthCheck rejects', async () => {
      redisClient.healthCheck.mockRejectedValue(new Error('Health check failed'));
      const health = await cacheHelper.healthCheck();
      expect(health.status).toBe('unhealthy');
      expect(health.cache.error).toBe('Health check failed');
    });
  });

  describe('flush', () => {
    it('should flush the cache', async () => {
      redisClient.client.flushDb.mockResolvedValue('OK');
      const result = await cacheHelper.flush();
      expect(result).toBe(true);
    });

    it('should return false if redisClient.client.flushDb rejects', async () => {
      redisClient.client.flushDb.mockRejectedValue(new Error('Redis error'));
      const result = await cacheHelper.flush();
      expect(result).toBe(false);
    });
  });
});
