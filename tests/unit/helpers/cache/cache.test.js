// =============================================================================
// CACHE HELPER - UNIT TESTS
// =============================================================================

const cacheHelper = require('../../../../helpers/cache.helper');
const redisClient = require('../../../../config/cache/redisClient');

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
  });

  describe('getTTL', () => {
    it('should get TTL for a key', async () => {
      redisClient.ttl.mockResolvedValue(60);
      const result = await cacheHelper.getTTL('test-key');
      expect(result).toBe(60);
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
  });

  describe('invalidateByTag', () => {
    it('should invalidate keys by tag', async () => {
      redisClient.client.sMembers.mockResolvedValue(['key1', 'key2']);
      redisClient.del.mockResolvedValue(2);
      const result = await cacheHelper.invalidateByTag('tag1');
      expect(result).toBe(2);
      expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
    });
  });

  describe('acquireLock', () => {
    it('should acquire a lock', async () => {
      redisClient.client.set.mockResolvedValue('OK');
      const token = await cacheHelper.acquireLock('lock-key');
      expect(token).toBeDefined();
    });
  });

  describe('releaseLock', () => {
    it('should release a lock', async () => {
      redisClient.client.eval.mockResolvedValue(1);
      const result = await cacheHelper.releaseLock('lock-key', 'lock-token');
      expect(result).toBe(true);
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
  });

  describe('flush', () => {
    it('should flush the cache', async () => {
      redisClient.client.flushDb.mockResolvedValue('OK');
      const result = await cacheHelper.flush();
      expect(result).toBe(true);
    });
  });
});
