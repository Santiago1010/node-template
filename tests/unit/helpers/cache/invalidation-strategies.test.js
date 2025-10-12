jest.mock('../../../../config/cache/redis.config', () => ({
  keys: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  exists: jest.fn(),
}));

const redisMock = require('../../../../config/cache/redis.config');
const cache = require('../../../../helpers/cache.helper');

describe('Invalidation strategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('invalidatePattern deletes matched keys', async () => {
    redisMock.keys.mockResolvedValue(['a', 'b']);
    redisMock.del.mockResolvedValue(2);

    const res = await cache.invalidatePattern('prefix:*');

    expect(res).toBe(2);
    expect(redisMock.keys).toHaveBeenCalledWith('prefix:*');
    expect(redisMock.del).toHaveBeenCalledWith(['a', 'b']);
  });

  test('invalidatePattern returns 0 when none', async () => {
    redisMock.keys.mockResolvedValue([]);

    const res = await cache.invalidatePattern('x:*');

    expect(res).toBe(0);
    expect(redisMock.keys).toHaveBeenCalledWith('x:*');
    expect(redisMock.del).not.toHaveBeenCalled();
  });

  test('tagKey adds key to tag set', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(['z']));
    redisMock.setEx.mockResolvedValue('OK');

    await cache.tagKey('k', ['t1', 't2'], 10);

    expect(redisMock.setEx).toHaveBeenCalledTimes(2);
    expect(redisMock.get).toHaveBeenCalled();
  });

  test('invalidateTag deletes tagged keys and tag', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify(['k1', 'k2']));
    redisMock.del.mockResolvedValue(3);

    const res = await cache.invalidateTag('t1');

    expect(res).toBe(3);
    expect(redisMock.del).toHaveBeenCalledTimes(2);
    expect(redisMock.del).toHaveBeenLastCalledWith(['k1', 'k2']);
  });
});
