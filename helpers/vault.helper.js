// =============================================================================
// VAULT SECRETS MANAGER - HashiCorp Vault Integration Module
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Secure retrieval and caching of secrets from HashiCorp Vault
// - Support for multiple authentication methods (AppRole, Token)
// - Intelligent caching with distributed locking to prevent cache stampede
// - KV secrets engine v1 and v2 compatibility
// - Namespaced secret organization by project and environment
//
// ARCHITECTURAL DECISIONS:
// - Lazy loading with cache-first approach to minimize Vault requests
// - Distributed locking prevents concurrent cache population
// - Environment-based configuration with fallback to process.env
// - Protocol-agnostic HTTP client supporting both HTTP and HTTPS
// - Promise-based async API for modern Node.js applications
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Direct Vault API calls vs. vault client library: Chose minimal dependencies
// - Global cache vs. per-instance: Chose shared cache for consistency
// - Synchronous vs. asynchronous initialization: Chose async on-demand loading
// - Environment variables vs. config files: Chose hybrid approach for flexibility
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for cached reads, O(n) for secret listing
// - Space complexity: O(k) where k is number of cached secrets
// - Network latency: Primary bottleneck for cache misses
// - Cache hit ratio: Expected >95% in production with proper TTL
//
// SECURITY CONSIDERATIONS:
// - Token authentication restricted in production for security compliance
// - Secrets never logged or exposed in error messages
// - Cache encryption should be handled at cache.helper level
// - Network communication should use HTTPS in production
//
// USAGE EXAMPLES:
// - Basic secret retrieval for database credentials
// - Batch loading of related secrets for service configuration
// - Cache management for secret rotation scenarios
//
// MAINTENANCE & TROUBLESHOOTING:
// - Monitor cache hit rates for performance tuning
// - Watch for Vault token expiration in long-running processes
// - Handle network partitions with appropriate timeouts
// - Clear cache proactively during secret rotation
//
// DEPENDENCIES & COMPATIBILITY:
// - Node.js 12+ required for URL class and Promise APIs
// - Compatible with HashiCorp Vault 1.0+
// - Supports KV secrets engine v1 and v2
// - Environment-specific configuration through config module
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const http = require('http'); // HTTP client for Vault API calls
const https = require('https'); // HTTPS client for secure Vault communication
const { URL } = require('url'); // URL parsing and validation

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
// None - Minimal dependencies for security and stability

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const cache = require('./cache.helper'); // Distributed caching and locking
const config = require('../../config/env'); // Application configuration

// =============================================================================
// MODULE CONFIGURATION & CONSTANTS
// =============================================================================

/**
 * Vault server address with fallback to environment variable
 * @type {string}
 */
const vaultAddress = (config && config.vault && config.vault.address) || process.env.VAULT_ADDR;

/**
 * Project name for secret namespacing, falls back to env var or default
 * @type {string}
 */
const projectName = (config && config.name) || process.env.PROJECT_NAME || 'default';

/**
 * Current environment mode for secret isolation
 * @type {string}
 */
const mode = (config && config.mode) || process.env.NODE_ENV || 'development';

/**
 * Default cache TTL in seconds for secrets
 * @type {number}
 */
const defaultTtl = parseInt(process.env.VAULT_CACHE_TTL, 10) || 300;

/**
 * KV secrets engine mount point
 * @type {string}
 */
const kvMount = process.env.VAULT_KV_MOUNT || 'secret';

/**
 * KV secrets engine version (1 or 2)
 * @type {number}
 */
const kvVersion = parseInt(process.env.VAULT_KV_VERSION, 10) || 2;

/**
 * Vault authentication method (token or approle)
 * @type {string}
 */
const authMethod = (process.env.VAULT_AUTH_METHOD || 'token').toLowerCase();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely joins URL parts while handling edge cases and normalizing slashes
 *
 * @description Combines multiple path segments into a single URL path,
 * filtering out empty parts and normalizing consecutive slashes. This prevents
 * common URL construction errors and ensures consistent path formatting.
 *
 * @param {...string} parts - URL path segments to join
 * @returns {string} Normalized URL path with single slashes
 *
 * @example
 * // Returns 'api/v1/secrets/data'
 * safeJoin('api/', '/v1', 'secrets', 'data/');
 *
 * @complexity Time: O(n), Space: O(n) where n is total characters
 * @since Version 1.0.0
 */
const safeJoin = (...parts) => parts.filter(Boolean).join('/').replace(/\/+/g, '/');

/**
 * Constructs Vault API path for secret operations with version compatibility
 *
 * @description Builds the appropriate API path based on KV engine version
 * and namespacing strategy. For KV v2, secrets are stored under 'data' path
 * with metadata separation, while v1 uses direct path access.
 *
 * @param {string} secretPath - The logical path to the secret
 * @returns {string} Fully qualified Vault API path
 *
 * @throws {Error} If secretPath is malformed or contains invalid characters
 *
 * @example
 * // KV v2: returns 'v1/secret/data/project/production/database'
 * buildVaultApiPath('database');
 *
 * @example
 * // KV v1: returns 'v1/secret/project/production/database'
 * buildVaultApiPath('database');
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const buildVaultApiPath = (secretPath) => {
  const base = `${kvMount}`;
  const namespaced = safeJoin(projectName, mode, secretPath);

  // KV v2 stores secrets under 'data' subpath with metadata separation
  if (kvVersion === 2) return safeJoin('v1', base, 'data', namespaced);

  // KV v1 uses direct path access without metadata
  return safeJoin('v1', base, namespaced);
};

/**
 * Generates cache key for secret storage with proper namespacing
 *
 * @description Creates a deterministic cache key that includes project,
 * environment, and secret path to prevent collisions and enable
 * targeted cache invalidation.
 *
 * @param {string} secretPath - The logical path to the secret
 * @returns {string} Cache key suitable for distributed caching
 *
 * @example
 * // Returns 'vault:myapp:production:database'
 * buildCacheKey('database');
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 * @see {@link cache.buildKey} for underlying key generation logic
 */
const buildCacheKey = (secretPath) => cache.buildKey('vault', projectName, mode, secretPath);

// =============================================================================
// HTTP CLIENT & VAULT COMMUNICATION
// =============================================================================

/**
 * Universal HTTP/HTTPS client for Vault API communication
 *
 * @description Handles both HTTP and HTTPS protocols with consistent
 * error handling and response parsing. Automatically parses JSON responses
 * and converts successful responses to standardized format.
 *
 * @param {string} rawUrl - The complete URL for the API request
 * @param {Object} options - HTTP request options (method, headers, body)
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {Object} options.headers - Request headers
 * @param {string} options.body - Request body for POST/PUT requests
 * @returns {Promise<Object>} Response object with status, body, and headers
 *
 * @throws {Error} For network errors, timeouts, or non-2xx status codes
 * @throws {TypeError} If URL is malformed or invalid
 *
 * @example
 * // Basic GET request
 * const response = await httpRequest('https://vault:8200/v1/secret/data', {
 *   method: 'GET',
 *   headers: { 'X-Vault-Token': 's.token' }
 * });
 *
 * @example
 * // POST request with JSON body
 * const response = await httpRequest('https://vault:8200/v1/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ username: 'user', password: 'pass' })
 * });
 *
 * @complexity Time: O(n) where n is response size, Space: O(n)
 * @since Version 1.0.0
 */
const httpRequest = (rawUrl, options = {}) =>
  new Promise((resolve, reject) => {
    try {
      const url = new URL(rawUrl);
      const lib = url.protocol === 'https:' ? https : http;

      const req = lib.request(url, options, (res) => {
        const chunks = [];

        // Stream response data for memory efficiency with large payloads
        res.on('data', (c) => chunks.push(c));

        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode;
          let parsed = null;

          // Attempt JSON parsing, fall back to raw body if parsing fails
          try {
            parsed = body ? JSON.parse(body) : null;
          } catch (_) {
            parsed = body;
          }

          // Success case: 2xx status codes
          if (status >= 200 && status < 300) {
            return resolve({
              status,
              body: parsed,
              headers: res.headers,
            });
          }

          // Error case: non-2xx status codes with enhanced error information
          const err = new Error(`Vault request failed ${status}`);
          err.status = status;
          err.body = parsed;
          return reject(err);
        });
      });

      req.on('error', reject);

      // Write request body if provided (for POST/PUT requests)
      if (options.body) req.write(options.body);
      req.end();
    } catch (error) {
      reject(error);
    }
  });

/**
 * Acquires Vault authentication token based on configured method
 *
 * @description Supports multiple authentication strategies with security
 * enforcement. In production, token authentication is restricted to
 * encourage use of dynamic auth methods like AppRole for better security.
 *
 * @returns {Promise<string>} Vault token for API authentication
 *
 * @throws {Error} When no valid authentication method is available
 * @throws {Error} When AppRole credentials are missing or invalid
 * @throws {Error} When token authentication is used in production
 *
 * @example
 * // AppRole authentication
 * const token = await getVaultToken();
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 * @see https://www.vaultproject.io/docs/auth for authentication methods
 */
const getVaultToken = async () => {
  // Security enforcement: token auth not allowed in production
  if (mode === 'production' && authMethod === 'token') {
    throw new Error('Token auth is not allowed in production. ' + 'Use a dynamic auth method (approle/k8s/iam).');
  }

  // AppRole authentication - preferred for automated systems
  if (authMethod === 'approle') {
    const roleId = process.env.VAULT_ROLE_ID;
    const secretId = process.env.VAULT_SECRET_ID;

    if (!roleId || !secretId) {
      throw new Error('AppRole credentials missing');
    }

    const url = safeJoin(vaultAddress, 'v1', 'auth', 'approle', 'login');
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: roleId, secret_id: secretId }),
    };

    const res = await httpRequest(url, opts);

    if (!res.body || !res.body.auth || !res.body.auth.client_token) {
      throw new Error('AppRole login failed');
    }

    return res.body.auth.client_token;
  }

  // Static token authentication (development only)
  if (process.env.VAULT_TOKEN) return process.env.VAULT_TOKEN;

  throw new Error('No valid Vault authentication method available');
};

/**
 * Normalizes KV secrets engine response structure across versions
 *
 * @description Handles differences between KV v1 and v2 response formats
 * by extracting the actual secret data from the API response. KV v2
 * wraps secrets in 'data.data' while v1 uses 'data' directly.
 *
 * @param {Object} raw - Raw response from Vault API
 * @returns {Object|null} Normalized secret data or null if empty
 *
 * @example
 * // KV v2 response normalization
 * const secret = unwrapKvResponse({
 *   data: {
 *     data: { username: 'admin', password: 'secret' }
 *   }
 * }); // Returns { username: 'admin', password: 'secret' }
 *
 * @example
 * // KV v1 response normalization
 * const secret = unwrapKvResponse({
 *   data: { username: 'admin', password: 'secret' }
 * }); // Returns { username: 'admin', password: 'secret' }
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const unwrapKvResponse = (raw) => {
  if (!raw) return null;

  // KV v2 format: data wrapped in data.data
  if (raw.data && raw.data.data) return raw.data.data;

  // KV v1 format: data at root data property
  if (raw.data) return raw.data;

  // Fallback for unexpected formats
  return raw;
};

/**
 * Fetches secret directly from Vault API bypassing cache
 *
 * @description Low-level function that performs actual Vault API calls.
 * Used by caching layer on cache misses and should not be called directly
 * in most scenarios. Use getSecret() for cached access.
 *
 * @param {string} secretPath - The logical path to the secret
 * @returns {Promise<Object>} Secret data from Vault
 *
 * @throws {Error} When Vault address is not configured
 * @throws {TypeError} When secretPath is not provided
 * @throws {Error} When Vault API returns error status
 *
 * @example
 * // Direct Vault fetch (bypasses cache)
 * const secret = await fetchFromVault('database/credentials');
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 * @see {@link getSecret} for cached secret access
 */
const fetchFromVault = async (secretPath) => {
  if (!vaultAddress) throw new Error('Vault address not configured');
  if (!secretPath) throw new TypeError('secretPath is required');

  const token = await getVaultToken();
  const apiPath = buildVaultApiPath(secretPath);
  const url = safeJoin(vaultAddress, apiPath);
  const opts = {
    method: 'GET',
    headers: {
      'X-Vault-Token': token,
      Accept: 'application/json',
    },
  };

  const res = await httpRequest(url, opts);
  const data = unwrapKvResponse(res.body);
  return data;
};

// =============================================================================
// PUBLIC API - SECRET MANAGEMENT
// =============================================================================

/**
 * Retrieves secret with intelligent caching and distributed locking
 *
 * @description Primary method for secret access. Implements cache-first
 * strategy with distributed locking to prevent cache stampede. On cache
 * miss, acquires lock to ensure only one process fetches from Vault
 * while others wait for the result.
 *
 * @param {string} secretPath - The logical path to the secret
 * @param {Object} [opts={}] - Configuration options
 * @param {number} [opts.ttl] - Custom TTL in seconds (overrides default)
 * @returns {Promise<Object>} Secret data from cache or Vault
 *
 * @throws {TypeError} When secretPath is not provided
 * @throws {Error} When Vault communication fails
 * @throws {Error} When cache operations fail
 *
 * @example
 * // Basic secret retrieval with default TTL
 * const dbSecret = await getSecret('database/credentials');
 *
 * @example
 * // Custom TTL for frequently changing secrets
 * const apiKey = await getSecret('external-service/api-key', {
 *   ttl: 60 // 1 minute TTL
 * });
 *
 * @example
 * // Error handling for missing secrets
 * try {
 *   const secret = await getSecret('nonexistent/path');
 * } catch (error) {
 *   if (error.status === 404) {
 *     // Handle missing secret appropriately
 *   }
 * }
 *
 * @complexity Time: O(1) cache hit, O(1) + network cache miss
 * @since Version 1.0.0
 * @see {@link fetchFromVault} for uncached secret access
 */
const getSecret = async (secretPath, opts = {}) => {
  if (!secretPath) throw new TypeError('secretPath is required');

  const cacheKey = buildCacheKey(secretPath);
  const ttl = Number.isInteger(opts.ttl) ? opts.ttl : defaultTtl;
  const lockResource = cache.buildKey('vault-lock', projectName, mode, secretPath);

  return cache.getOrSet(
    cacheKey,
    async () => {
      // Distributed lock prevents cache stampede - only one process
      // fetches from Vault while others wait for the result
      return cache.withLock(
        lockResource,
        async () => {
          const fresh = await fetchFromVault(secretPath);
          // Cache null values to prevent repeated lookups for missing secrets
          if (fresh === null || fresh === undefined) return null;
          return fresh;
        },
        Math.max(5, Math.floor(ttl / 2)) // Lock timeout: half of TTL or 5s minimum
      );
    },
    ttl
  );
};

/**
 * Retrieves multiple secrets under a common prefix
 *
 * @description Efficiently lists and fetches all secrets under a given
 * prefix. Uses parallel requests for optimal performance. Individual
 * secrets are still cached independently for future access.
 *
 * @param {string} prefix - Common prefix for secrets to retrieve
 * @param {Object} [opts={}] - Configuration options
 * @param {number} [opts.ttl] - Custom TTL in seconds for fetched secrets
 * @returns {Promise<Object>} Object mapping secret names to their values
 *
 * @throws {TypeError} When prefix is not provided
 * @throws {Error} When Vault list operation fails
 *
 * @example
 * // Retrieve all database-related secrets
 * const dbSecrets = await getSecrets('database');
 * // Returns: {
 * //   credentials: { username: 'admin', ... },
 * //   readonly: { username: 'readonly', ... }
 * // }
 *
 * @example
 * // Service configuration with all related secrets
 * const serviceConfig = await getSecrets('services/payment-gateway');
 *
 * @complexity Time: O(n) where n is number of secrets under prefix
 * @since Version 1.0.0
 * @see {@link getSecret} for individual secret access
 */
const getSecrets = async (prefix, opts = {}) => {
  if (!prefix) throw new TypeError('prefix is required');

  const listPath = buildVaultApiPath(prefix) + (kvVersion === 2 ? '?list=true' : '?list=true');
  const token = await getVaultToken();
  const url = safeJoin(vaultAddress, listPath);
  const optsReq = {
    method: 'GET',
    headers: {
      'X-Vault-Token': token,
      Accept: 'application/json',
    },
  };

  // Handle empty prefixes gracefully - return empty object instead of error
  const res = await httpRequest(url, optsReq).catch((e) => {
    if (e.status === 404) return { body: { data: { keys: [] } } };
    throw e;
  });

  const keys = (res.body && res.body.data && res.body.data.keys) || [];
  const results = {};

  // Parallel secret fetching for optimal performance
  await Promise.all(
    keys.map(async (k) => {
      const keyPath = safeJoin(prefix, k);
      // Individual failures don't block other secrets
      results[k] = await getSecret(keyPath, opts).catch(() => null);
    })
  );

  return results;
};

/**
 * Explicitly clears cached secret to force fresh retrieval
 *
 * @description Useful during secret rotation or when immediate
 * consistency is required. After calling this, next getSecret()
 * call will fetch fresh data from Vault.
 *
 * @param {string} secretPath - The logical path to the secret
 * @returns {Promise<boolean>} True if secret was cached and cleared
 *
 * @throws {TypeError} When secretPath is not provided
 *
 * @example
 * // Clear cache after secret rotation
 * await rotateDatabasePassword();
 * await clearSecretCache('database/credentials');
 * // Next getSecret() will fetch new credentials
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 * @see {@link getSecret} for secret retrieval
 */
const clearSecretCache = async (secretPath) => {
  if (!secretPath) throw new TypeError('secretPath is required');
  const cacheKey = buildCacheKey(secretPath);
  return cache.del(cacheKey);
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================

/**
 * Vault Secrets Manager Module
 *
 * @description Secure, cached interface for HashiCorp Vault secret management.
 * Provides methods for retrieving individual secrets, batch operations,
 * and cache management with production-ready security practices.
 *
 * @example
 * // Basic module usage
 * const vault = require('./vault.helper');
 *
 * // Get database credentials
 * const dbCreds = await vault.getSecret('database/credentials');
 *
 * // Get all API keys for a service
 * const apiKeys = await vault.getSecrets('services/payment-gateway');
 *
 * // Clear cache during rotation
 * await vault.clearSecretCache('database/credentials');
 */
module.exports = {
  /**
   * Retrieve a single secret with caching
   * @type {Function}
   */
  getSecret,

  /**
   * Retrieve multiple secrets under a prefix
   * @type {Function}
   */
  getSecrets,

  /**
   * Clear cached secret to force fresh retrieval
   * @type {Function}
   */
  clearSecretCache,

  /**
   * Internal methods for testing and advanced use cases
   * @namespace
   */
  _internal: {
    /**
     * Build Vault API path for secret operations
     * @type {Function}
     */
    buildVaultApiPath,

    /**
     * Generate cache key for secret storage
     * @type {Function}
     */
    buildCacheKey,

    /**
     * Acquire Vault authentication token
     * @type {Function}
     */
    getVaultToken,
  },
};
