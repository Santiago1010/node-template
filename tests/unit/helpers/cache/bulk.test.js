jest.mock('../../../../config/cache/redis.config', () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
}));

const redis = require('../../../../config/cache/redis.config');
const cache3 = require('../../../../helpers/cache.helper');

describe('Bulk operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mget returns key-value object with nulls for miss', async () => {
    redis.get.mockImplementation((k) => {
      if (k === 'a') return Promise.resolve(JSON.stringify({ a: 1 }));
      return Promise.resolve(null);
    });

    const res = await cache3.mget(['a', 'b']);
    expect(res).toEqual({ a: { a: 1 }, b: null });
  });

  test('mget throws on invalid input', async () => {
    await expect(cache3.mget('not-array')).rejects.toThrow(TypeError);
    await expect(cache3.mget([])).rejects.toThrow(TypeError);
  });

  test('mset stores multiple entries', async () => {
    redis.setEx.mockResolvedValue('OK');

    await cache3.mset({ 'k:a': 1, 'k:b': 2 }, 10);

    expect(redis.setEx).toHaveBeenCalledTimes(2);
    expect(redis.setEx).toHaveBeenCalledWith('k:a', 10, JSON.stringify(1));
    expect(redis.setEx).toHaveBeenCalledWith('k:b', 10, JSON.stringify(2));
  });

  test('mset throws on invalid entries', async () => {
    await expect(cache3.mset(null)).rejects.toThrow(TypeError);
  });
});
