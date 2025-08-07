const { createClient } = require('redis');
const { redis } = require('../index');

class RedisClient {
  constructor() {
    this.client = createClient({
      url: 'redis://' + redis.host + ':' + redis.port,
      password: redis.password,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        keepAlive: 30000,
        connectTimeout: 10000,
        lazyConnect: false,
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
      retry_unfulfilled_commands: true,
      enable_offline_queue: false,
    });

    this.connectionStats = {
      connected: false,
      reconnectCount: 0,
      lastError: null,
      uptime: Date.now(),
    };

    this.initEvents();
    this.connect();
  }

  initEvents() {
    this.client.on('error', (err) => {
      console.error('Redis Error:', err);
      this.connectionStats.lastError = err;
      this.connectionStats.connected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
      this.connectionStats.connected = true;
      this.connectionStats.lastError = null;
    });

    this.client.on('ready', () => {
      console.log('Redis ready');
      this.connectionStats.connected = true;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis reconnecting');
      this.connectionStats.reconnectCount++;
      this.connectionStats.connected = false;
    });

    this.client.on('end', () => {
      console.log('Redis connection ended');
      this.connectionStats.connected = false;
    });
  }

  async connect() {
    try {
      await this.client.connect();
      setInterval(() => this.client.ping(), 60000); // Keep alive
    } catch (error) {
      console.error('Redis connection failed:', error);
      process.exit(1);
    }
  }

  async get(key) {
    return this.client.get(key);
  }
  async set(key, value) {
    return this.client.set(key, value);
  }
  async setEx(key, ttl, value) {
    return this.client.setEx(key, ttl, value);
  }
  async del(keys) {
    return this.client.del(keys);
  }
  async keys(pattern) {
    return this.client.keys(pattern);
  }
  async exists(keys) {
    if (!keys) {
      throw new Error('Keys parameter is required');
    }

    // Handle both single key (string) or multiple keys (array)
    if (Array.isArray(keys)) {
      return this.client.exists(keys);
    } else {
      return this.client.exists([keys]);
    }
  }

  async ttl(key) {
    return this.client.ttl(key);
  }

  async info(section) {
    return this.client.info(section);
  }

  async ping() {
    return this.client.ping();
  }

  getConnectionStats() {
    return {
      ...this.connectionStats,
      uptime: Date.now() - this.connectionStats.uptime,
    };
  }

  async healthCheck() {
    try {
      const pong = await this.ping();
      const info = await this.info('server');

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
}

module.exports = new RedisClient();
