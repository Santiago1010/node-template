# Redis Cache Configuration

This directory contains the configuration for the Redis client, which is used for high-performance in-memory caching.

## File Structure

```
cache/
└── redis.config.js
```

---

### `redis.config.js`

This file is responsible for creating and managing the connection to the Redis server. It exports a singleton instance of a custom `RedisClient` class that wraps the `node-redis` library, providing enhanced features for robustness and ease of use.

**Key Features:**

-   **Singleton Pattern**: It exports a single, shared instance of the `RedisClient`, ensuring that only one connection pool is created and managed throughout the application's lifecycle.
-   **Connection Management**: The client is configured to automatically connect when the application starts.
-   **Automatic Reconnection**: If the connection to the Redis server is lost, the client will automatically try to reconnect with an exponential backoff strategy (it waits progressively longer between retries). This makes the connection resilient to temporary network issues.
-   **Health Checks**: It includes a `healthCheck` method to monitor the status of the Redis connection, which can be used for diagnostics or in a dedicated health check endpoint.
-   **Promise-Based API**: All Redis commands are wrapped in methods that return Promises, making it easy to work with `async/await`.
-   **Event Handling**: The client listens for important connection events (`connect`, `ready`, `error`, `reconnecting`, `end`) and logs them to the console, providing visibility into the connection's status.
-   **Graceful Shutdown**: A `disconnect` method is available to gracefully close the connection when the application is shutting down.
-   **Legacy Client Support**: It also exports a `createLegacyClient` function for compatibility with older libraries that may not support the modern `node-redis` v4+ API.

**Configuration:**

The connection details (host, port, password) are sourced from the environment variables managed in `config/env/index.js`, ensuring that no sensitive credentials are hard-coded.

## How to Use

To interact with the Redis cache, import the singleton client from this file.

**Example:**

```javascript
const redisClient = require('@config/cache/redis.config.js');

async function cacheUserSession(userId, sessionData) {
  try {
    // Set a value with a 24-hour expiration
    await redisClient.setEx(`session:${userId}`, 3600 * 24, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to cache session:', error);
  }
}

async function getUserSession(userId) {
  try {
    const session = await redisClient.get(`session:${userId}`);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Failed to retrieve session from cache:', error);
    return null;
  }
}
```
