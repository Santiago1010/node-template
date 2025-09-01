// =============================================================================
// CACHE HELPER - Redis Cache Management Utility
// =============================================================================
//
// This module provides a high-level interface for Redis cache operations.
// It includes automatic serialization/deserialization, error handling,
// performance monitoring, and advanced cache patterns like tags and bulk operations.
//
// Features:
// - Automatic JSON serialization/deserialization
// - TTL (Time To Live) support with flexible expiration
// - Cache tagging for grouped invalidation
// - Bulk operations for better performance
// - Error handling and logging
// - Performance metrics and monitoring
// - Cache warming and preloading capabilities
// - Memory-safe operations with size limits
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const redisClient = require('../config/cache/redisClient');
const { CACHE_CONFIG } = require('./constants.helper');
const { cerror } = require('./debug.helper');

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Cache performance metrics
 */
const metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  totalOperations: 0,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates cache key format and length
 * @param {string} key - Cache key to validate
 * @throws {Error} If key is invalid
 */
function validateKey(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Cache key must be a non-empty string');
  }

  if (key.length > CACHE_CONFIG.MAX_KEY_LENGTH) {
    throw new Error(`Cache key exceeds maximum length of ${CACHE_CONFIG.MAX_KEY_LENGTH} characters`);
  }

  // Prevent keys with problematic characters
  if (/[\s\n\r\t]/.test(key)) {
    throw new Error('Cache key cannot contain whitespace characters');
  }
}

/**
 * Serializes data for storage in Redis
 * @param {*} data - Data to serialize
 * @returns {string} Serialized data
 */
function serialize(data) {
  if (data === null || data === undefined) {
    return JSON.stringify({ __null: true, __type: typeof data });
  }

  if (typeof data === 'string') {
    return JSON.stringify({ __string: true, data });
  }

  return JSON.stringify({ data });
}

/**
 * Deserializes data from Redis storage
 * @param {string} serializedData - Serialized data string
 * @returns {*} Deserialized data
 */
function deserialize(serializedData) {
  if (!serializedData) {
    return null;
  }

  try {
    const parsed = JSON.parse(serializedData);

    if (parsed.__null) {
      return parsed.__type === 'undefined' ? undefined : null;
    }

    if (parsed.__string) {
      return parsed.data;
    }

    return parsed.data;
  } catch (error) {
    cerror('Deserialize data', `Error deserializing data: ${error.message}`);
    // If JSON parsing fails, return the raw string
    return serializedData;
  }
}

/**
 * Updates performance metrics
 * @param {string} operation - Type of operation (hit, miss, set, delete, error)
 */
function updateMetrics(operation) {
  metrics[operation]++;
  metrics.totalOperations++;
}

/**
 * Logs cache operations for debugging
 * @param {string} operation - Operation type
 * @param {string} key - Cache key
 * @param {*} details - Additional details
 */
function logOperation(operation, key, details = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CACHE] ${operation.toUpperCase()}: ${key}`, details);
  }
}

// =============================================================================
// MAIN CACHE HELPER CLASS
// =============================================================================

class CacheHelper {
  /**
   * Gets a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value or null if not found
   */
  async get(key) {
    try {
      validateKey(key);

      const value = await redisClient.get(key);

      if (value === null) {
        updateMetrics('misses');
        logOperation('miss', key);
        return null;
      }

      updateMetrics('hits');
      logOperation('hit', key);

      return deserialize(value);
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache get error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Sets a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    try {
      validateKey(key);

      const serializedValue = serialize(value);

      // Check value size
      if (serializedValue.length > CACHE_CONFIG.MAX_VALUE_SIZE) {
        throw new Error(`Cache value exceeds maximum size of ${CACHE_CONFIG.MAX_VALUE_SIZE} bytes`);
      }

      let result;
      if (ttl > 0) {
        result = await redisClient.setEx(key, ttl, serializedValue);
      } else {
        result = await redisClient.set(key, serializedValue);
      }

      updateMetrics('sets');
      logOperation('set', key, { ttl, size: serializedValue.length });

      return result === 'OK';
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache set error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Deletes one or more keys from cache
   * @param {string|string[]} keys - Cache key(s) to delete
   * @returns {Promise<number>} Number of keys deleted
   */
  async delete(keys) {
    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];

      // Validate all keys
      keyArray.forEach(validateKey);

      const deletedCount = await redisClient.del(keyArray);

      updateMetrics('deletes');
      logOperation('delete', keyArray.join(', '), { count: deletedCount });

      return deletedCount;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache delete error for keys "${keys}":`, error);
      return 0;
    }
  }

  /**
   * Checks if a key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Whether key exists
   */
  async exists(key) {
    try {
      validateKey(key);

      const exists = await redisClient.exists(key);
      return exists > 0;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache exists error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Gets the TTL (time to live) of a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
   */
  async getTTL(key) {
    try {
      validateKey(key);

      return await redisClient.ttl(key);
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache TTL error for key "${key}":`, error);
      return -2;
    }
  }

  /**
   * Gets multiple values from cache in a single operation
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async getMany(keys) {
    try {
      if (!Array.isArray(keys) || keys.length === 0) {
        return {};
      }

      // Validate all keys
      keys.forEach(validateKey);

      const pipeline = redisClient.client.multi();
      keys.forEach((key) => pipeline.get(key));

      const results = await pipeline.exec();
      const values = {};

      keys.forEach((key, index) => {
        const [error, value] = results[index];

        if (error) {
          console.error(`Cache getMany error for key "${key}":`, error);
          values[key] = null;
          updateMetrics('errors');
        } else if (value === null) {
          values[key] = null;
          updateMetrics('misses');
        } else {
          values[key] = deserialize(value);
          updateMetrics('hits');
        }
      });

      logOperation('getMany', keys.join(', '), { found: Object.keys(values).length });
      return values;
    } catch (error) {
      updateMetrics('errors');
      console.error('Cache getMany error:', error);
      return {};
    }
  }

  /**
   * Sets multiple values in cache in a single operation
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async setMany(keyValuePairs, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    try {
      if (!keyValuePairs || typeof keyValuePairs !== 'object') {
        throw new Error('keyValuePairs must be an object');
      }

      const entries = Object.entries(keyValuePairs);
      if (entries.length === 0) {
        return true;
      }

      // Validate all keys and serialize values
      const serializedPairs = [];
      for (const [key, value] of entries) {
        validateKey(key);
        const serializedValue = serialize(value);

        if (serializedValue.length > CACHE_CONFIG.MAX_VALUE_SIZE) {
          throw new Error(`Cache value for key "${key}" exceeds maximum size`);
        }

        serializedPairs.push([key, serializedValue]);
      }

      const pipeline = redisClient.client.multi();

      for (const [key, serializedValue] of serializedPairs) {
        if (ttl > 0) {
          pipeline.setEx(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      }

      const results = await pipeline.exec();
      const successCount = results.filter(([error, result]) => !error && result === 'OK').length;

      updateMetrics('sets');
      logOperation('setMany', Object.keys(keyValuePairs).join(', '), {
        total: entries.length,
        success: successCount,
        ttl,
      });

      return successCount === entries.length;
    } catch (error) {
      updateMetrics('errors');
      console.error('Cache setMany error:', error);
      return false;
    }
  }

  /**
   * Gets or sets a value (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch data if not in cache
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<*>} Cached or fetched value
   */
  async getOrSet(key, fetchFunction, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    try {
      // Try to get from cache first
      let value = await this.get(key);

      if (value !== null) {
        return value;
      }

      // Not in cache, fetch the data
      if (typeof fetchFunction !== 'function') {
        throw new Error('fetchFunction must be a function');
      }

      value = await fetchFunction();

      // Store in cache for future requests
      if (value !== undefined) {
        await this.set(key, value, ttl);
      }

      logOperation('getOrSet', key, { fetched: true, ttl });
      return value;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache getOrSet error for key "${key}":`, error);

      // Try to execute fetch function as fallback
      try {
        return await fetchFunction();
      } catch (fetchError) {
        console.error(`Fetch function error for key "${key}":`, fetchError);
        return null;
      }
    }
  }

  /**
   * Invalidates cache keys by pattern
   * @param {string} pattern - Redis key pattern (e.g., "user:*")
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const deletedCount = await this.delete(keys);
      logOperation('invalidatePattern', pattern, { count: deletedCount });

      return deletedCount;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache invalidatePattern error for pattern "${pattern}":`, error);
      return 0;
    }
  }

  /**
   * Adds tags to a cache entry for grouped invalidation
   * @param {string} key - Cache key
   * @param {string|string[]} tags - Tag(s) to associate with the key
   * @returns {Promise<boolean>} Success status
   */
  async tag(key, tags) {
    try {
      validateKey(key);

      const tagArray = Array.isArray(tags) ? tags : [tags];
      const pipeline = redisClient.client.multi();

      // Add key to each tag set
      for (const tag of tagArray) {
        const tagKey = `${CACHE_CONFIG.TAG_PREFIX}${tag}`;
        pipeline.sAdd(tagKey, key);
        pipeline.expire(tagKey, CACHE_CONFIG.DEFAULT_TTL * 24); // Tags expire after 24x default TTL
      }

      await pipeline.exec();
      logOperation('tag', key, { tags: tagArray });

      return true;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache tag error for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Invalidates all cache entries with specific tags
   * @param {string|string[]} tags - Tag(s) to invalidate
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateByTag(tags) {
    try {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      let totalDeleted = 0;

      for (const tag of tagArray) {
        const tagKey = `${CACHE_CONFIG.TAG_PREFIX}${tag}`;
        const keys = await redisClient.client.sMembers(tagKey);

        if (keys.length > 0) {
          const deleted = await this.delete(keys);
          totalDeleted += deleted;
        }

        // Clean up the tag set
        await redisClient.del([tagKey]);
      }

      logOperation('invalidateByTag', tagArray.join(', '), { count: totalDeleted });
      return totalDeleted;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache invalidateByTag error for tags "${tags}":`, error);
      return 0;
    }
  }

  /**
   * Acquires a distributed lock
   * @param {string} lockKey - Lock identifier
   * @param {number} [ttl] - Lock TTL in seconds
   * @returns {Promise<string|null>} Lock token if acquired, null if failed
   */
  async acquireLock(lockKey, ttl = CACHE_CONFIG.DEFAULT_LOCK_TTL) {
    try {
      const lockToken = Date.now().toString() + Math.random().toString(36);
      const fullLockKey = `${CACHE_CONFIG.LOCK_PREFIX}${lockKey}`;

      const result = await redisClient.client.set(fullLockKey, lockToken, {
        PX: ttl * 1000, // Convert to milliseconds
        NX: true, // Only set if key doesn't exist
      });

      if (result === 'OK') {
        logOperation('acquireLock', lockKey, { token: lockToken, ttl });
        return lockToken;
      }

      return null;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache acquireLock error for key "${lockKey}":`, error);
      return null;
    }
  }

  /**
   * Releases a distributed lock
   * @param {string} lockKey - Lock identifier
   * @param {string} lockToken - Lock token from acquisition
   * @returns {Promise<boolean>} Success status
   */
  async releaseLock(lockKey, lockToken) {
    try {
      const fullLockKey = `${CACHE_CONFIG.LOCK_PREFIX}${lockKey}`;

      // Lua script to atomically check token and delete if it matches
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await redisClient.client.eval(luaScript, {
        keys: [fullLockKey],
        arguments: [lockToken],
      });

      const released = result === 1;
      logOperation('releaseLock', lockKey, { token: lockToken, released });

      return released;
    } catch (error) {
      updateMetrics('errors');
      console.error(`Cache releaseLock error for key "${lockKey}":`, error);
      return false;
    }
  }

  /**
   * Gets current cache performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const hitRate =
      metrics.totalOperations > 0 ? ((metrics.hits / (metrics.hits + metrics.misses)) * 100).toFixed(2) : 0;

    return {
      ...metrics,
      hitRate: `${hitRate}%`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Resets performance metrics
   */
  resetMetrics() {
    Object.keys(metrics).forEach((key) => {
      metrics[key] = 0;
    });

    logOperation('resetMetrics', 'all');
  }

  /**
   * Performs cache health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const redisHealth = await redisClient.healthCheck();
      const metrics = this.getMetrics();

      return {
        status: redisHealth.status,
        cache: {
          ...redisHealth,
          metrics,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        cache: {
          connected: false,
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Clears all cache data (use with caution!)
   * @returns {Promise<boolean>} Success status
   */
  async flush() {
    try {
      await redisClient.client.flushDb();
      logOperation('flush', 'all');
      return true;
    } catch (error) {
      updateMetrics('errors');
      console.error('Cache flush error:', error);
      return false;
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
// Export singleton instance of CacheHelper
// This ensures consistent cache management across the application
//
// =============================================================================
module.exports = new CacheHelper();
