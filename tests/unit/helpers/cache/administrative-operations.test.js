jest.mock('../../../../config/cache/redis.config', () => ({
  keys: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
}));

describe('Administrative operations', () => {
  let redis;
  let cache7;

  beforeEach(() => {
    jest.resetModules(); // fuerza que require vuelva a cargar los módulos
    jest.clearAllMocks();

    redis = require('../../../../config/cache/redis.config'); // mock creado arriba
    cache7 = require('../../../../helpers/cache.helper'); // ahora el helper obtiene el redis mockeado
  });

  test('flush deletes all keys returned by keys', async () => {
    redis.keys.mockResolvedValue(['a', 'b']);
    redis.del.mockResolvedValue(2);

    const res = await cache7.flush();
    expect(redis.keys).toHaveBeenCalledWith('*');
    expect(redis.del).toHaveBeenCalledWith(['a', 'b']);
    expect(res).toBe(2);
  });

  test('flush returns 0 when no keys', async () => {
    redis.keys.mockResolvedValue([]);
    // No mock de del necesario porque no debería llamarse
    const res = await cache7.flush();
    expect(redis.keys).toHaveBeenCalledWith('*');
    expect(redis.del).not.toHaveBeenCalled();
    expect(res).toBe(0);
  });
});
