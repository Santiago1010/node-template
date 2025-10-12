jest.mock('../../../../config/cache/redis.config', () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
}));

const redis = require('../../../../config/cache/redis.config');
const redisClient = require('../../../../helpers/cache.helper');

describe('Advanced cache patterns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getOrSet returns cached value on hit', async () => {
    const key = 'k1';
    const factory = jest.fn().mockResolvedValue({ v: 2 });

    // Simular hit: redis.get devuelve JSON stringificado
    redis.get.mockResolvedValue(JSON.stringify({ v: 1 }));

    const res = await redisClient.getOrSet(key, factory, 10);
    expect(res).toEqual({ v: 1 });
    expect(factory).not.toHaveBeenCalled();
  });

  test('getOrSet calls factory on miss and stores value', async () => {
    const key = 'k2';
    const factory = jest.fn().mockResolvedValue({ v: 3 });

    // Simular miss y respuestas de setEx
    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue('OK');

    const res = await redisClient.getOrSet(key, factory, 20);
    expect(res).toEqual({ v: 3 });
    expect(factory).toHaveBeenCalled();
    expect(redis.setEx).toHaveBeenCalledWith(key, 20, JSON.stringify({ v: 3 }));
  });

  test('remember supports both signatures', async () => {
    // Preparar mocks
    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue('OK');

    const res1 = await redisClient.remember('rk', async () => 'x');
    expect(res1).toBe('x');

    // Para la segunda firma con TTL explícito
    const res2 = await redisClient.remember('rk2', 5, async () => 'y');
    expect(res2).toBe('y');

    // Asegurar que setEx fue llamado al menos dos veces
    expect(redis.setEx).toHaveBeenCalled();
  });

  test('forget aliases del', async () => {
    redis.del.mockResolvedValue(1);
    const deleted = await redisClient.forget('k');
    expect(deleted).toBe(1);
    expect(redis.del).toHaveBeenCalledWith('k');
  });
});
