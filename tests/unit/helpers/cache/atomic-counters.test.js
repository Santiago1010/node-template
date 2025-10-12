jest.mock('../../../../config/cache/redis.config', () => ({
  exists: jest.fn(),
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  ttl: jest.fn(),
}));

const redis = require('../../../../config/cache/redis.config');

describe('Atomic counters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('increment increases numeric value', async () => {
    redis.get.mockResolvedValue('2');
    redis.setEx.mockResolvedValue('OK');

    const cache5 = require('../../../../helpers/cache.helper');
    const v = await cache5.increment('counter', 3);
    expect(v).toBe(5);
  });

  test('increment initializes to amount when no current', async () => {
    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue('OK');

    const cache5 = require('../../../../helpers/cache.helper');
    const v = await cache5.increment('counter', 4);
    expect(v).toBe(4);
  });

  test('increment throws on non-integer amount', async () => {
    const cache5 = require('../../../../helpers/cache.helper');
    await expect(cache5.increment('c', 1.5)).rejects.toThrow(TypeError);
  });

  test('decrement delegates to increment with negative amount', async () => {
    const cache5 = require('../../../../helpers/cache.helper');
    const spy = jest.spyOn(cache5, 'increment');
    await cache5.decrement('c', 2);
    expect(spy).toHaveBeenCalledWith('c', -2);
  });
});
