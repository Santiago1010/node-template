// =============================================================================
// Redis Client - High-performance Redis connection management
// =============================================================================
// Comprehensive documentation explaining:
// 1. Primary purpose and functionality: A robust Redis client wrapper providing
//    connection management, automatic reconnection, health monitoring, and
//    simplified API for common Redis operations with enhanced error handling.
// 2. Why this specific implementation was chosen: Uses node-redis v4+ for its
//    Promise-native API and connection pooling. Includes production-ready
//    features like connection health checks, automatic reconnection strategies,
//    and comprehensive monitoring.
// 3. Alternative approaches that were considered:
//    - ioredis: More feature-rich but heavier
//    - direct redis package usage: Would require implementing all reliability features manually
//    - Connection pooling alternatives: Generic pool vs. built-in redis pooling
// 4. Trade-offs and consequences of alternatives:
//    - ioredis: Better for cluster support but larger bundle size
//    - Manual implementation: More control but higher maintenance overhead
//    - Generic pooling: More flexibility but less Redis-specific optimization
// 5. Performance characteristics:
//    - Connection pooling maintains hot connections for O(1) operations
//    - All methods are O(1) except keys() which is O(N) where N is number of keys
//    - Automatic pipelining in node-redis improves batch operations
// 6. Usage examples and edge cases:
//    - Handles connection drops with exponential backoff reconnect
//    - Includes health check endpoint for monitoring
//    - Validates input for critical methods
//    - Handles both single and multi-key operations
//
// Security considerations:
// - Uses password authentication from environment variables
// - Connection strings are constructed securely
// - No sensitive data logged in error messages
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { createClient } = require('redis');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { redis } = require('../env').cache;

/**
 * Enhanced Redis client with connection management and monitoring
 * @class RedisClient
 */
class RedisClient {
  /**
   * Creates a new Redis client instance
   * @param {Object} [customConfig] - Optional custom configuration
   */
  constructor(customConfig = {}) {
    const config = {
      url: `redis://${redis.host}:${redis.port}`,
      password: redis.password,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        keepAlive: 30000,
        connectTimeout: 10000,
        lazyConnect: false,
      },
      ...customConfig,
    };

    this.client = createClient(config);
    this.connectionStats = {
      connected: false,
      reconnectCount: 0,
      lastError: null,
      uptime: Date.now(),
      lastPing: null,
    };

    this.pingInterval = null;
    this.initEvents();
  }

  /**
   * Initialize event listeners for the Redis client
   * @private
   */
  initEvents() {
    this.client.on('error', (err) => {
      console.error('Redis client error', { error: err.message });
      this.connectionStats.lastError = err;
      this.connectionStats.connected = false;
    });

    this.client.on('connect', () => {
      console.info('🟡 Redis client connecting');
      this.connectionStats.connected = false;
    });

    this.client.on('ready', () => {
      console.info('🟢 Redis client ready');
      this.connectionStats.connected = true;
      this.connectionStats.lastError = null;
    });

    this.client.on('reconnecting', () => {
      console.info('Redis client reconnecting');
      this.connectionStats.reconnectCount++;
    });

    this.client.on('end', () => {
      console.info('Redis connection ended');
      this.connectionStats.connected = false;
      this.cleanupPingInterval();
    });
  }

  /**
   * Establish connection to Redis server
   * @throws {Error} If connection fails after retries
   */
  async connect() {
    try {
      await this.client.connect();
      this.startPingInterval();
    } catch (error) {
      console.error('Redis connection failed', { error: error.message });
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  /**
   * Start periodic ping to keep connection alive
   * @private
   */
  startPingInterval() {
    this.cleanupPingInterval();
    this.pingInterval = setInterval(async () => {
      try {
        await this.client.ping();
        this.connectionStats.lastPing = Date.now();
      } catch (error) {
        console.warn('Redis ping failed', { error: error.message });
      }
    }, 60000);
  }

  /**
   * Clear ping interval
   * @private
   */
  cleanupPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get value by key
   * @param {string} key - Redis key
   * @returns {Promise<string|null>} Stored value or null
   */
  async get(key) {
    if (typeof key !== 'string') {
      throw new TypeError('Key must be a string');
    }
    return this.client.get(key);
  }

  /**
   * Set value for key
   * @param {string} key - Redis key
   * @param {string} value - Value to store
   * @returns {Promise<void>}
   */
  async set(key, value) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw new TypeError('Key and value must be strings');
    }
    return this.client.set(key, value);
  }

  /**
   * Set value with expiration
   * @param {string} key - Redis key
   * @param {number} ttl - Time to live in seconds
   * @param {string} value - Value to store
   * @returns {Promise<void>}
   */
  async setEx(key, ttl, value) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw new TypeError('Key and value must be strings');
    }
    if (!Number.isInteger(ttl) || ttl <= 0) {
      throw new TypeError('TTL must be a positive integer');
    }
    return this.client.setEx(key, ttl, value);
  }

  /**
   * Delete keys
   * @param {string|string[]} keys - Key or array of keys to delete
   * @returns {Promise<number>} Number of deleted keys
   */
  async del(keys) {
    if (!keys || (typeof keys !== 'string' && !Array.isArray(keys))) {
      throw new TypeError('Keys must be a string or array of strings');
    }
    return this.client.del(keys);
  }

  /**
   * Find keys matching pattern (use cautiously in production)
   * @param {string} pattern - Redis glob pattern
   * @returns {Promise<string[]>} Matching keys
   */
  async keys(pattern) {
    if (typeof pattern !== 'string') {
      throw new TypeError('Pattern must be a string');
    }
    return this.client.keys(pattern);
  }

  /**
   * Check if key(s) exist
   * @param {string|string[]} keys - Key or array of keys to check
   * @returns {Promise<number>} Number of existing keys
   */
  async exists(keys) {
    if (!keys) {
      throw new Error('Keys parameter is required');
    }

    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.some((key) => typeof key !== 'string')) {
      throw new TypeError('All keys must be strings');
    }

    return this.client.exists(keyArray);
  }

  /**
   * Get time-to-live for key
   * @param {string} key - Redis key
   * @returns {Promise<number>} TTL in seconds (-2 if doesn't exist, -1 if no expiry)
   */
  async ttl(key) {
    if (typeof key !== 'string') {
      throw new TypeError('Key must be a string');
    }
    return this.client.ttl(key);
  }

  /**
   * Get Redis server information
   * @param {string} [section] - Optional info section
   * @returns {Promise<string>} Server information
   */
  async info(section) {
    return this.client.info(section);
  }

  /**
   * Ping Redis server
   * @returns {Promise<string>} PONG response
   */
  async ping() {
    return this.client.ping();
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getConnectionStats() {
    return {
      ...this.connectionStats,
      uptime: Date.now() - this.connectionStats.uptime,
    };
  }

  /**
   * Perform health check
   * @returns {Promise<Object>} Health status object
   */
  async healthCheck() {
    try {
      const [pong, info] = await Promise.all([this.ping(), this.info('server')]);

      return {
        status: 'healthy',
        connected: this.connectionStats.connected,
        ping: pong === 'PONG',
        stats: this.getConnectionStats(),
        serverInfo: info ? info.split('\r\n').slice(1, 6) : [],
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        stats: this.getConnectionStats(),
      };
    }
  }

  /**
   * Gracefully disconnect from Redis
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.cleanupPingInterval();
    await this.client.quit();
  }
}

// Create singleton instance
const redisClient = new RedisClient();

// Auto-connect on initialization with retry logic
(async () => {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await redisClient.connect();
      break;
    } catch (error) {
      console.error(`Redis connection attempt ${attempt} failed`, { error: error.message });
      if (attempt === maxRetries) {
        console.error('All Redis connection attempts failed');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Fixed setTimeout usage
    }
  }
})();

/**
 * Creates a legacy Redis client (v3 compatible) for packages that require it
 * @param {Object} [customConfig] - Optional custom configuration
 * @returns {RedisClient} Legacy Redis client instance
 */
const createLegacyClient = (customConfig = {}) => {
  const config = {
    url: `redis://${redis.host}:${redis.port}`,
    password: redis.password,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      keepAlive: 30000,
      connectTimeout: 10000,
      lazyConnect: false,
    },
    legacyMode: true, // Enable legacy mode for v3 compatibility
    ...customConfig,
  };

  return createClient(config);
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = redisClient;
module.exports.createLegacyClient = createLegacyClient;
