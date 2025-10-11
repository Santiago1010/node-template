const redisClient = require('~/config/cache/redis.config');
const { CACHE_CONFIG } = require('~/utils/constants.util');

const buildKey = (...parts) => {
  return parts.filter(Boolean).join(':');
};

const get = async (key) => {
  if (!key) throw new TypeError('Key is required');

  try {
    const value = await redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Cache get error', { key, error: error.message });
    throw error;
  }
};

const set = async (key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  if (!key) throw new TypeError('Key is required');
  if (value === undefined) throw new TypeError('Value is required');
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new TypeError('TTL must be a positive integer');
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (serialized.length > CACHE_CONFIG.MAX_VALUE_SIZE) {
      throw new Error('Value exceeds maximum size');
    }

    await redisClient.setEx(key, ttl, serialized);
  } catch (error) {
    console.error('Cache set error', { key, error: error.message });
    throw error;
  }
};

const del = async (keys) => {
  if (!keys) throw new TypeError('Keys parameter is required');

  try {
    return await redisClient.del(keys);
  } catch (error) {
    console.error('Cache delete error', { keys, error: error.message });
    throw error;
  }
};

const exists = async (keys) => {
  if (!keys) throw new TypeError('Keys parameter is required');

  try {
    return await redisClient.exists(keys);
  } catch (error) {
    console.error('Cache exists error', { keys, error: error.message });
    throw error;
  }
};

const ttl = async (key) => {
  if (!key) throw new TypeError('Key is required');

  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.error('Cache TTL error', { key, error: error.message });
    throw error;
  }
};

const getOrSet = async (key, factory, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  if (!key) throw new TypeError('Key is required');
  if (typeof factory !== 'function') {
    throw new TypeError('Factory must be a function');
  }

  try {
    const cached = await get(key);
    if (cached !== null) return cached;

    const value = await factory();
    if (value !== undefined) {
      await set(key, value, ttl);
    }

    return value;
  } catch (error) {
    console.error('Cache getOrSet error', { key, error: error.message });
    throw error;
  }
};

const mget = async (keys) => {
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new TypeError('Keys must be a non-empty array');
  }

  try {
    const values = await Promise.all(keys.map((key) => get(key)));
    return keys.reduce((acc, key, index) => {
      acc[key] = values[index];
      return acc;
    }, {});
  } catch (error) {
    console.error('Cache mget error', { keys, error: error.message });
    throw error;
  }
};

const mset = async (entries, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  if (!entries || typeof entries !== 'object') {
    throw new TypeError('Entries must be an object');
  }

  try {
    const promises = Object.entries(entries).map(([key, value]) => set(key, value, ttl));
    await Promise.all(promises);
  } catch (error) {
    console.error('Cache mset error', { error: error.message });
    throw error;
  }
};

const invalidatePattern = async (pattern) => {
  if (!pattern) throw new TypeError('Pattern is required');

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;

    return await del(keys);
  } catch (error) {
    console.error('Cache invalidate pattern error', { pattern, error: error.message });
    throw error;
  }
};

const invalidateTag = async (tag) => {
  if (!tag) throw new TypeError('Tag is required');

  try {
    const tagKey = buildKey(CACHE_CONFIG.TAG_PREFIX, tag);
    const keys = await get(tagKey);

    if (!keys || !Array.isArray(keys) || keys.length === 0) return 0;

    await del(tagKey);
    return await del(keys);
  } catch (error) {
    console.error('Cache invalidate tag error', { tag, error: error.message });
    throw error;
  }
};

const tagKey = async (key, tags, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  if (!key) throw new TypeError('Key is required');
  if (!Array.isArray(tags) || tags.length === 0) {
    throw new TypeError('Tags must be a non-empty array');
  }

  try {
    const tagOperations = tags.map(async (tag) => {
      const tagKey = buildKey(CACHE_CONFIG.TAG_PREFIX, tag);
      const existingKeys = (await get(tagKey)) || [];

      if (!existingKeys.includes(key)) {
        existingKeys.push(key);
        await set(tagKey, existingKeys, ttl);
      }
    });

    await Promise.all(tagOperations);
  } catch (error) {
    console.error('Cache tag key error', { key, tags, error: error.message });
    throw error;
  }
};

const remember = async (key, ttl, factory) => {
  if (typeof ttl === 'function') {
    factory = ttl;
    ttl = CACHE_CONFIG.DEFAULT_TTL;
  }

  return getOrSet(key, factory, ttl);
};

const forget = async (key) => {
  return del(key);
};

const flush = async () => {
  try {
    const allKeys = await redisClient.keys('*');
    if (allKeys.length === 0) return 0;

    return await del(allKeys);
  } catch (error) {
    console.error('Cache flush error', { error: error.message });
    throw error;
  }
};

const increment = async (key, amount = 1) => {
  if (!key) throw new TypeError('Key is required');
  if (!Number.isInteger(amount)) {
    throw new TypeError('Amount must be an integer');
  }

  try {
    const current = await get(key);
    const newValue = (parseInt(current) || 0) + amount;
    await set(key, newValue);
    return newValue;
  } catch (error) {
    console.error('Cache increment error', { key, error: error.message });
    throw error;
  }
};

const decrement = async (key, amount = 1) => {
  return increment(key, -amount);
};

const lock = async (resource, ttl = CACHE_CONFIG.DEFAULT_LOCK_TTL) => {
  if (!resource) throw new TypeError('Resource is required');

  const lockKey = buildKey(CACHE_CONFIG.LOCK_PREFIX, resource);
  const lockValue = Date.now().toString();

  try {
    const isLocked = await exists(lockKey);
    if (isLocked) return null;

    await set(lockKey, lockValue, ttl);
    return lockValue;
  } catch (error) {
    console.error('Cache lock error', { resource, error: error.message });
    throw error;
  }
};

const unlock = async (resource, lockValue) => {
  if (!resource) throw new TypeError('Resource is required');
  if (!lockValue) throw new TypeError('Lock value is required');

  const lockKey = buildKey(CACHE_CONFIG.LOCK_PREFIX, resource);

  try {
    const currentValue = await get(lockKey);
    if (currentValue === lockValue) {
      await del(lockKey);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Cache unlock error', { resource, error: error.message });
    throw error;
  }
};

const withLock = async (resource, callback, ttl = CACHE_CONFIG.DEFAULT_LOCK_TTL) => {
  if (!resource) throw new TypeError('Resource is required');
  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function');
  }

  const lockValue = await lock(resource, ttl);
  if (!lockValue) {
    throw new Error('Failed to acquire lock');
  }

  try {
    return await callback();
  } finally {
    await unlock(resource, lockValue);
  }
};

module.exports = {
  buildKey,
  get,
  set,
  del,
  exists,
  ttl,
  getOrSet,
  mget,
  mset,
  invalidatePattern,
  invalidateTag,
  tagKey,
  remember,
  forget,
  flush,
  increment,
  decrement,
  lock,
  unlock,
  withLock,
};
