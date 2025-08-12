// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
// Import asyncLocalStorage instance for request context management
const asyncLocalStorage = require('../context/requestContext');
// Import debugging utility
const { clog } = require('./debug.helper');

/**
 * Request Context Helper
 *
 * Provides utilities for managing request-specific context using AsyncLocalStorage.
 * Enables storing and retrieving data throughout the lifecycle of a request without
 * explicitly passing context objects. Particularly useful for:
 * - Storing user authentication details
 * - Tracking request IDs
 * - Managing page-specific data
 * - Sharing state across middleware and services
 *
 * All functions safely handle cases where store is unavailable (outside request context).
 */

/**
 * Retrieves the entire context store for current request
 * @returns {Object} The current request context store
 */
const getStore = () => {
  return asyncLocalStorage.getStore();
};

/**
 * Retrieves a specific value from request context by key
 * @param {string} key - Context property name to retrieve
 * @returns {*} Value of the requested property or undefined
 */
const getFromContext = (key) => {
  const store = asyncLocalStorage.getStore();
  return store ? store[key] : undefined; // Safely handle missing store
};

/**
 * Sets a value in the request context
 * @param {string} key - Context property name to set
 * @param {*} value - Value to assign
 */
const setInContext = (key, value) => {
  const store = asyncLocalStorage.getStore();
  // Only update if store exists (within active request context)
  if (store) store[key] = value;
};

/**
 * Updates multiple values in the context simultaneously
 * @param {Object} updates - Key-value pairs to merge into context
 */
const updateContext = (updates) => {
  const store = asyncLocalStorage.getStore();
  if (store) Object.assign(store, updates); // Merge updates if store exists
};

/**
 * Extracts standardized user context information
 * @returns {Object} Contains userId, userRole, and requestId
 */
const getUserContext = () => {
  const store = asyncLocalStorage.getStore();
  return store
    ? {
        userId: store.userId,
        userRole: store.userRole,
        requestId: store.requestId,
      }
    : {}; // Return empty object if outside request context
};

/**
 * Retrieves page-specific context with debug logging
 * @returns {Object|null} Page context object or null
 */
const getPageContext = () => {
  const store = asyncLocalStorage.getStore();
  // Log page context state for debugging
  clog('Page context', store.page || null);

  return store ? store.page : null;
};

module.exports = {
  getStore,
  getFromContext,
  setInContext,
  updateContext,
  getUserContext,
  getPageContext,
};
