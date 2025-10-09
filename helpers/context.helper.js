// =============================================================================
// CONTEXT MANAGEMENT HELPER - AsyncLocalStorage-Based Request Context Handling
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Provides thread-local storage for Node.js async operations using AsyncLocalStorage
// - Maintains request-scoped context throughout async call chains
// - Enables consistent access to contextual data (user, request, organization info)
// - Supports CRUD operations on context data with error handling
// - Facilitates correlation ID tracking across distributed systems
// - Enables request-specific logging and debugging
//
// ARCHITECTURAL DECISIONS:
// - Uses AsyncLocalStorage over async_hooks directly for better stability and abstraction
// - Implements defensive programming with comprehensive error handling
// - Provides both generic and domain-specific context accessors
// - Uses moment.js for standardized timestamp handling
// - Follows a static class pattern for global accessibility
// - Implements snapshot/restore functionality for context persistence
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - AsyncWrap/async_hooks: More complex implementation, potential performance impact
// - Continuation-local-storage: Community package with similar functionality but additional dependency
// - Request context passing: Manual context passing through function parameters (cumbersome and error-prone)
// - Global variables: Not async-safe and would leak between requests
// - Why chosen: AsyncLocalStorage is native, stable, and provides the right abstraction level
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for most operations (key access, updates)
// - Space complexity: O(n) where n is number of context keys
// - Minimal overhead compared to manual context passing
// - AsyncLocalStorage has minimal performance impact in Node.js 16+
// - Snapshot operations have O(n) complexity due to JSON serialization
//
// SECURITY CONSIDERATIONS:
// - No sensitive data should be stored in context without encryption
// - Context isolation prevents cross-request data leakage
// - Input validation performed for snapshot operations
// - No authentication/authorization logic - purely data storage
// - Consider data sanitization for user-provided context values
//
// USAGE EXAMPLES:
// - Basic context initialization:
//   ContextHelper.run({ userId: '123' }, () => {
//     ContextHelper.set('requestId', 'abc');
//     const value = ContextHelper.get('userId');
//   });
//
// - Request processing in web frameworks:
//   app.use((req, res, next) => {
//     ContextHelper.run(getInitialContext(req), next);
//   });
//
// - Domain-specific context access:
//   const userContext = ContextHelper.getUserContext();
//   const requestContext = ContextHelper.getRequestContext();
//
// MAINTENANCE & TROUBLESHOOTING:
// - Common error: Forgetting to call .run() before other operations
// - Debug: Use snapshot() to inspect context state
// - Ensure proper context cleanup in error scenarios
// - Monitor memory usage for very large contexts
// - Use try-catch blocks when working with context in critical paths
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 16+ (AsyncLocalStorage support)
// - Uses moment.js for timestamp handling
// - Compatible with Express, Koa, and other web frameworks
// - Works with any async/await or callback-based code
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
// Built-in AsyncLocalStorage accessed via internal dependency

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment'); // Date handling and ISO string formatting

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const asyncLocalStorage = require('../config/context'); // AsyncLocalStorage instance
const { CONTEXT_KEYS } = require('../utils/constants.util'); // Context key constants
const { cerror } = require('./debug.helper'); // Error logging utility

// =============================================================================
// CONTEXT HELPER
// =============================================================================

/**
 * Context Helper - AsyncLocalStorage-based context management for request-scoped data
 * @class
 * @description Provides methods for managing async context throughout request lifecycle.
 * Maintains isolation between concurrent requests while providing easy access to contextual data.
 * Essential for maintaining request-specific state across asynchronous operations.
 */
class ContextHelper {
  /**
   * Initializes and runs callback within context
   * @param {Object} [initialData={}] - Initial context data
   * @param {Function} callback - Function to execute within context
   * @returns {*} Returns callback result
   * @throws {Error} If context initialization fails
   * @example
   * // Basic usage
   * ContextHelper.run({ userId: '123' }, () => {
   *   // Context is available here
   * });
   *
   * @example
   * // With async/await
   * await ContextHelper.run({ requestId: 'abc' }, async () => {
   *   await someAsyncOperation();
   * });
   */
  static run(initialData = {}, callback) {
    try {
      // Add timestamp if not provided - ensures all contexts have consistent timing
      const contextData = {
        [CONTEXT_KEYS.TIMESTAMP]: moment().toISOString(), // ISO 8601 format for consistency
        ...initialData, // User-provided data takes precedence
      };

      return asyncLocalStorage.run(contextData, callback);
    } catch (error) {
      cerror('Error running context:', error);
      throw error;
    }
  }

  /**
   * Retrieves context data or specific value
   * @param {string} [key=null] - Optional key for specific value
   * @returns {*|null} Context data, specific value, or null if not found
   * @example
   * // Get entire context
   * const entireContext = ContextHelper.get();
   *
   * @example
   * // Get specific value
   * const userId = ContextHelper.get('userId');
   */
  static get(key = null) {
    try {
      const context = asyncLocalStorage.getStore();

      if (!context) {
        return null;
      }

      if (key) {
        return context[key] || null; // Return null instead of undefined for missing keys
      }

      return context;
    } catch (error) {
      cerror('Error getting context:', error);
      return null;
    }
  }

  /**
   * Sets a value or multiple values in the context
   * @param {string|Object} keyOrObject - Key string or object to merge
   * @param {*} [value=undefined] - Value to set (only used if first param is string)
   * @returns {boolean} Success status
   * @example
   * // Set single value
   * ContextHelper.set('userId', '123');
   *
   * @example
   * // Set multiple values
   * ContextHelper.set({ userId: '123', requestId: 'abc' });
   */
  static set(keyOrObject, value = undefined) {
    try {
      const context = asyncLocalStorage.getStore();

      if (!context) {
        cerror('No active context found. Make sure to call ContextHelper.run() first.');
        return false;
      }

      if (typeof keyOrObject === 'string') {
        // Single key-value pair
        context[keyOrObject] = value;
      } else if (typeof keyOrObject === 'object' && keyOrObject !== null) {
        // Merge object into context - overwrites existing keys
        Object.assign(context, keyOrObject);
      } else {
        cerror('Invalid parameter type. Expected string or object.');
        return false;
      }

      return true;
    } catch (error) {
      cerror('Error setting context:', error);
      return false;
    }
  }

  /**
   * Updates existing context values (only modifies existing keys)
   * @param {string|Object} keyOrObject - Key string or object with updates
   * @param {*} [value=undefined] - New value (only used if first param is string)
   * @returns {boolean} Success status
   * @example
   * // Update single value
   * ContextHelper.update('userId', '456');
   *
   * @example
   * // Update multiple values
   * ContextHelper.update({ userId: '456', status: 'active' });
   */
  static update(keyOrObject, value = undefined) {
    try {
      const context = asyncLocalStorage.getStore();

      if (!context) {
        cerror('No active context found. Make sure to call ContextHelper.run() first.');
        return false;
      }

      if (typeof keyOrObject === 'string') {
        // Update single key if it exists
        if (Object.prototype.hasOwnProperty.call(context, keyOrObject)) {
          context[keyOrObject] = value;
          return true;
        } else {
          cerror(`Key '${keyOrObject}' does not exist in context.`);
          return false;
        }
      } else if (typeof keyOrObject === 'object' && keyOrObject !== null) {
        // Update only existing keys from object - protects against adding new keys
        let updated = false;
        for (const [key, val] of Object.entries(keyOrObject)) {
          if (Object.hasOwn(context, key)) {
            context[key] = val;
            updated = true;
          }
        }
        return updated;
      } else {
        cerror('Invalid parameter type. Expected string or object.');
        return false;
      }
    } catch (error) {
      cerror('Error updating context:', error);
      return false;
    }
  }

  /**
   * Removes a key or multiple keys from the context
   * @param {string|Array<string>} keyOrKeys - Key or array of keys to remove
   * @returns {boolean} Success status
   * @example
   * // Remove single key
   * ContextHelper.remove('tempData');
   *
   * @example
   * // Remove multiple keys
   * ContextHelper.remove(['tempData', 'cacheKey']);
   */
  static remove(keyOrKeys) {
    try {
      const context = asyncLocalStorage.getStore();

      if (!context) {
        cerror('No active context found. Make sure to call ContextHelper.run() first.');
        return false;
      }

      if (typeof keyOrKeys === 'string') {
        delete context[keyOrKeys];
        return true;
      } else if (Array.isArray(keyOrKeys)) {
        keyOrKeys.forEach((key) => delete context[key]);
        return true;
      } else {
        cerror('Invalid parameter type. Expected string or array.');
        return false;
      }
    } catch (error) {
      cerror('Error removing from context:', error);
      return false;
    }
  }

  /**
   * Checks if context exists and is active
   * @returns {boolean} True if context is active
   * @example
   * if (ContextHelper.isActive()) {
   *   // Safe to use context operations
   * }
   */
  static isActive() {
    try {
      return asyncLocalStorage.getStore() !== undefined;
    } catch (error) {
      cerror('Error checking context status:', error);
      return false;
    }
  }

  /**
   * Checks if a key exists in the context
   * @param {string} key - Key to check
   * @returns {boolean} True if key exists
   * @example
   * if (ContextHelper.has('userId')) {
   *   // Key exists
   * }
   */
  static has(key) {
    try {
      const context = asyncLocalStorage.getStore();
      return context ? Object.hasOwn(context, key) : false;
    } catch (error) {
      cerror('Error checking key existence:', error);
      return false;
    }
  }

  /**
   * Gets all keys in the current context
   * @returns {Array<string>} Array of context keys
   * @example
   * const keys = ContextHelper.keys();
   * console.log('Context contains:', keys);
   */
  static keys() {
    try {
      const context = asyncLocalStorage.getStore();
      return context ? Object.keys(context) : [];
    } catch (error) {
      cerror('Error getting context keys:', error);
      return [];
    }
  }

  /**
   * Gets the number of keys in the context
   * @returns {number} Number of keys in context
   * @example
   * if (ContextHelper.size() > 10) {
   *   // Context is getting large
   * }
   */
  static size() {
    try {
      const context = asyncLocalStorage.getStore();
      return context ? Object.keys(context).length : 0;
    } catch (error) {
      cerror('Error getting context size:', error);
      return 0;
    }
  }

  /**
   * Clears all context data while keeping the context active
   * @returns {boolean} Success status
   * @example
   * // Reset context while maintaining async context
   * ContextHelper.clear();
   */
  static clear() {
    try {
      const context = asyncLocalStorage.getStore();

      if (!context) {
        cerror('No active context found. Make sure to call ContextHelper.run() first.');
        return false;
      }

      // Remove all keys but keep context object reference
      Object.keys(context).forEach((key) => delete context[key]);
      return true;
    } catch (error) {
      cerror('Error clearing context:', error);
      return false;
    }
  }

  /**
   * Creates a deep copy of the current context state
   * @returns {Object|null} Context snapshot or null on error
   * @complexity Time: O(n), Space: O(n) where n is context size
   * @example
   * const snapshot = ContextHelper.snapshot();
   * // Store for later restoration or debugging
   */
  static snapshot() {
    try {
      const context = asyncLocalStorage.getStore();
      return context ? JSON.parse(JSON.stringify(context)) : null;
    } catch (error) {
      cerror('Error creating context snapshot:', error);
      return null;
    }
  }

  /**
   * Restores context from a previously created snapshot
   * @param {Object} snapshot - Context snapshot to restore
   * @returns {boolean} Success status
   * @example
   * const snapshot = ContextHelper.snapshot();
   * // Later...
   * ContextHelper.restore(snapshot);
   */
  static restore(snapshot) {
    try {
      if (!snapshot || typeof snapshot !== 'object') {
        cerror('Invalid snapshot provided.');
        return false;
      }

      const context = asyncLocalStorage.getStore();

      if (!context) {
        cerror('No active context found. Make sure to call ContextHelper.run() first.');
        return false;
      }

      // Clear current context and restore from snapshot
      Object.keys(context).forEach((key) => delete context[key]);
      Object.assign(context, snapshot);

      return true;
    } catch (error) {
      cerror('Error restoring context:', error);
      return false;
    }
  }

  /**
   * Gets user-specific context data in a structured format
   * @returns {Object} User context data
   * @example
   * const userContext = ContextHelper.getUserContext();
   * console.log('User ID:', userContext.userId);
   */
  static getUserContext() {
    try {
      const context = asyncLocalStorage.getStore();
      if (!context) return {};

      return {
        userId: context[CONTEXT_KEYS.USER_ID],
        userData: context[CONTEXT_KEYS.USER_DATA],
        sessionId: context[CONTEXT_KEYS.SESSION_ID],
        permissions: context[CONTEXT_KEYS.PERMISSIONS],
        roles: context[CONTEXT_KEYS.ROLES],
      };
    } catch (error) {
      cerror('Error getting user context:', error);
      return {};
    }
  }

  /**
   * Gets request-specific context data in a structured format
   * @returns {Object} Request context data
   * @example
   * const requestContext = ContextHelper.getRequestContext();
   * console.log('Request ID:', requestContext.requestId);
   */
  static getRequestContext() {
    try {
      const context = asyncLocalStorage.getStore();
      if (!context) return {};

      return {
        requestId: context[CONTEXT_KEYS.REQUEST_ID],
        correlationId: context[CONTEXT_KEYS.CORRELATION_ID],
        transactionId: context[CONTEXT_KEYS.TRANSACTION_ID],
        ipAddress: context[CONTEXT_KEYS.IP_ADDRESS],
        userAgent: context[CONTEXT_KEYS.USER_AGENT],
        timestamp: context[CONTEXT_KEYS.TIMESTAMP],
      };
    } catch (error) {
      cerror('Error getting request context:', error);
      return {};
    }
  }

  /**
   * Gets organization-specific context data in a structured format
   * @returns {Object} Organization context data
   * @example
   * const orgContext = ContextHelper.getOrganizationContext();
   * console.log('Tenant ID:', orgContext.tenantId);
   */
  static getOrganizationContext() {
    try {
      const context = asyncLocalStorage.getStore();
      if (!context) return {};

      return {
        tenantId: context[CONTEXT_KEYS.TENANT_ID],
        organizationId: context[CONTEXT_KEYS.ORGANIZATION_ID],
        departmentId: context[CONTEXT_KEYS.DEPARTMENT_ID],
        clientId: context[CONTEXT_KEYS.CLIENT_ID],
      };
    } catch (error) {
      cerror('Error getting organization context:', error);
      return {};
    }
  }

  /**
   * Merges multiple context objects into the current context
   * @param {...Object} contexts - Context objects to merge
   * @returns {boolean} Success status
   * @example
   * ContextHelper.merge({ key1: 'value1' }, { key2: 'value2' });
   */
  static merge(...contexts) {
    try {
      const context = asyncLocalStorage.getStore();

      if (!context) {
        cerror('No active context found. Make sure to call ContextHelper.run() first.');
        return false;
      }

      contexts.forEach((ctx) => {
        if (ctx && typeof ctx === 'object') {
          Object.assign(context, ctx);
        }
      });

      return true;
    } catch (error) {
      cerror('Error merging contexts:', error);
      return false;
    }
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = ContextHelper;
