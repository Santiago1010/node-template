jest.mock('../../../../config/cache/redis.config', () => ({
  exists: jest.fn(),
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  ttl: jest.fn(),
}));

const redis = require('../../../../config/cache/redis.config');

let cache6;

describe('Distributed locking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache6 = require('../../../../helpers/cache.helper');
  });

  test('lock returns null when already locked', async () => {
    redis.exists.mockResolvedValue(1);

    const v = await cache6.lock('r');
    expect(v).toBeNull();
    expect(redis.exists).toHaveBeenCalled();
    expect(redis.setEx).not.toHaveBeenCalled();
  });

  test('lock acquires lock when free', async () => {
    redis.exists.mockResolvedValue(0);
    redis.setEx.mockResolvedValue('OK');

    const v = await cache6.lock('r', 5);
    expect(typeof v).toBe('string');
    expect(redis.exists).toHaveBeenCalled();
    expect(redis.setEx).toHaveBeenCalledWith(expect.any(String), 5, expect.any(String));
  });

  test('unlock releases only when value matches', async () => {
    redis.get.mockResolvedValue('123');
    redis.del.mockResolvedValue(1);

    const resTrue = await cache6.unlock('r', '123');
    expect(resTrue).toBe(true);
    expect(redis.get).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalled();

    redis.get.mockResolvedValue('999');
    redis.del.mockClear();

    const resFalse = await cache6.unlock('r', '123');
    expect(resFalse).toBe(false);
    expect(redis.del).not.toHaveBeenCalled();
  });

  test('withLock executes callback and releases', async () => {
    // queue exists = 0 so lock is free
    redis.exists.mockResolvedValue(0);

    // we capture the lockValue that the helper writes when setEx is called
    let capturedLockValue = null;
    redis.setEx.mockImplementation((_, __, value) => {
      // store the lock value so redis.get() can return it later
      capturedLockValue = value;
      return Promise.resolve('OK');
    });

    // when unlock calls redis.get, return the exact capturedLockValue so del() happens
    redis.get.mockImplementation(async () => capturedLockValue);

    redis.del.mockResolvedValue(1);

    const result = await cache6.withLock('res', async () => 'done', 3);
    expect(result).toBe('done');

    expect(redis.exists).toHaveBeenCalled();
    expect(redis.setEx).toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalled();
  });

  test('withLock throws when lock cannot be acquired', async () => {
    redis.exists.mockResolvedValue(1);

    await expect(cache6.withLock('res', async () => 'ignored')).rejects.toThrow('Failed to acquire lock');
    expect(redis.setEx).not.toHaveBeenCalled();
  });
});
