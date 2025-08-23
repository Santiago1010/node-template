// =============================================================================
// CONTEXT HELPER - AsyncLocalStorage context management utilities
// =============================================================================
// This module provides comprehensive functions for managing data stored within
// AsyncLocalStorage context. It handles user sessions, request data, security
// context, and other contextual information throughout the application lifecycle.
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const asyncLocalStorage = require('../config/context');
const { CONTEXT_KEYS } = require('./constants.helper');
const { cerror } = require('./debug.helper');

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================
const DEFAULT_CONTEXT = {
  [CONTEXT_KEYS.TIMESTAMP]: () => moment().toISOString(),
  [CONTEXT_KEYS.REQUEST_ID]: () => generateUniqueId(),
  [CONTEXT_KEYS.CUSTOM_DATA]: () => ({}),
  [CONTEXT_KEYS.PERMISSIONS]: () => [],
  [CONTEXT_KEYS.ROLES]: () => [],
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a unique identifier for requests/sessions
 * @returns {string} Unique identifier
 */
const generateUniqueId = () => {
  return `${moment().valueOf()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Validates if a context key is allowed
 * @param {string} key - Context key to validate
 * @returns {boolean} True if key is valid
 */
const isValidContextKey = (key) => {
  return Object.values(CONTEXT_KEYS).includes(key) || key.startsWith('custom_');
};

/**
 * Sanitizes context data to prevent injection attacks
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
const sanitizeContextData = (data) => {
  if (typeof data === 'string') {
    // Basic XSS prevention
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeContextData(value);
    }
    return sanitized;
  }
  return data;
};

// =============================================================================
// CORE CONTEXT MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Initializes a new context with default values
 * @param {Object} initialData - Initial context data
 * @param {Function} callback - Function to execute within the context
 * @returns {Promise<any>} Result of the callback function
 */
const runWithContext = async (initialData = {}, callback) => {
  try {
    const contextData = {
      ...Object.keys(DEFAULT_CONTEXT).reduce((acc, key) => {
        acc[key] = DEFAULT_CONTEXT[key]();
        return acc;
      }, {}),
      ...sanitizeContextData(initialData),
    };

    return await asyncLocalStorage.run(contextData, callback);
  } catch (error) {
    throw new Error(`Failed to run with context: ${error.message}`);
  }
};

/**
 * Gets the entire current context
 * @returns {Object|undefined} Current context data
 */
const getContext = () => {
  try {
    return asyncLocalStorage.getStore();
  } catch (error) {
    throw new Error(`Failed to get context: ${error.message}`);
  }
};

/**
 * Checks if context is currently available
 * @returns {boolean} True if context exists
 */
const hasContext = () => {
  try {
    return asyncLocalStorage.getStore() !== undefined;
  } catch (error) {
    cerror('Has context', `Error checking context: ${error.message}`);
    return false;
  }
};

/**
 * Clears the current context (use with caution)
 * @returns {boolean} True if context was cleared
 */
const clearContext = () => {
  try {
    // Note: AsyncLocalStorage doesn't have a direct clear method
    // This would typically be handled by ending the async context
    return true;
  } catch (error) {
    throw new Error(`Failed to clear context: ${error.message}`);
  }
};

// =============================================================================
// CONTEXT DATA GETTERS
// =============================================================================

/**
 * Gets a specific value from the context
 * @param {string} key - Context key to retrieve
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Context value or default
 */
const getContextValue = (key, defaultValue = null) => {
  try {
    const store = asyncLocalStorage.getStore();
    return store && store.prototype.hasOwnProperty.call(key) ? store[key] : defaultValue;
  } catch (error) {
    throw new Error(`Failed to get context value for key '${key}': ${error.message}`);
  }
};

/**
 * Gets multiple values from the context
 * @param {string[]} keys - Array of context keys to retrieve
 * @returns {Object} Object containing requested key-value pairs
 */
const getContextValues = (keys) => {
  try {
    const store = asyncLocalStorage.getStore();
    const result = {};

    if (!store) return result;

    keys.forEach((key) => {
      if (store.prototype.hasOwnProperty.call(key)) {
        result[key] = store[key];
      }
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to get context values: ${error.message}`);
  }
};

/**
 * Gets the current user ID from context
 * @returns {string|null} User ID or null
 */
const getCurrentUserId = () => {
  return getContextValue(CONTEXT_KEYS.USER_ID);
};

/**
 * Gets the current user data from context
 * @returns {Object|null} User data object or null
 */
const getCurrentUserData = () => {
  return getContextValue(CONTEXT_KEYS.USER_DATA);
};

/**
 * Gets the current session ID from context
 * @returns {string|null} Session ID or null
 */
const getCurrentSessionId = () => {
  return getContextValue(CONTEXT_KEYS.SESSION_ID);
};

/**
 * Gets the current request ID from context
 * @returns {string|null} Request ID or null
 */
const getCurrentRequestId = () => {
  return getContextValue(CONTEXT_KEYS.REQUEST_ID);
};

/**
 * Gets the current IP address from context
 * @returns {string|null} IP address or null
 */
const getCurrentIpAddress = () => {
  return getContextValue(CONTEXT_KEYS.IP_ADDRESS);
};

/**
 * Gets the current user agent from context
 * @returns {string|null} User agent string or null
 */
const getCurrentUserAgent = () => {
  return getContextValue(CONTEXT_KEYS.USER_AGENT);
};

/**
 * Gets the current timestamp from context
 * @returns {string|null} ISO timestamp or null
 */
const getCurrentTimestamp = () => {
  return getContextValue(CONTEXT_KEYS.TIMESTAMP);
};

/**
 * Gets the current user permissions from context
 * @returns {Array} Array of permissions
 */
const getCurrentPermissions = () => {
  return getContextValue(CONTEXT_KEYS.PERMISSIONS, []);
};

/**
 * Gets the current user roles from context
 * @returns {Array} Array of roles
 */
const getCurrentRoles = () => {
  return getContextValue(CONTEXT_KEYS.ROLES, []);
};

/**
 * Gets the current tenant ID from context
 * @returns {string|null} Tenant ID or null
 */
const getCurrentTenantId = () => {
  return getContextValue(CONTEXT_KEYS.TENANT_ID);
};

/**
 * Gets the current correlation ID from context
 * @returns {string|null} Correlation ID or null
 */
const getCurrentCorrelationId = () => {
  return getContextValue(CONTEXT_KEYS.CORRELATION_ID);
};

// =============================================================================
// CONTEXT DATA SETTERS
// =============================================================================

/**
 * Sets a value in the current context
 * @param {string} key - Context key
 * @param {any} value - Value to set
 * @returns {boolean} True if value was set successfully
 */
const setContextValue = (key, value) => {
  try {
    if (!isValidContextKey(key)) {
      throw new Error(`Invalid context key: ${key}`);
    }

    const store = asyncLocalStorage.getStore();
    if (!store) {
      throw new Error('No active context found');
    }

    store[key] = sanitizeContextData(value);
    return true;
  } catch (error) {
    throw new Error(`Failed to set context value for key '${key}': ${error.message}`);
  }
};

/**
 * Sets multiple values in the current context
 * @param {Object} keyValuePairs - Object containing key-value pairs to set
 * @returns {boolean} True if all values were set successfully
 */
const setContextValues = (keyValuePairs) => {
  try {
    const store = asyncLocalStorage.getStore();
    if (!store) {
      throw new Error('No active context found');
    }

    Object.entries(keyValuePairs).forEach(([key, value]) => {
      if (!isValidContextKey(key)) {
        throw new Error(`Invalid context key: ${key}`);
      }
      store[key] = sanitizeContextData(value);
    });

    return true;
  } catch (error) {
    throw new Error(`Failed to set context values: ${error.message}`);
  }
};

/**
 * Sets the current user ID in context
 * @param {string} userId - User ID to set
 * @returns {boolean} True if set successfully
 */
const setCurrentUserId = (userId) => {
  return setContextValue(CONTEXT_KEYS.USER_ID, userId);
};

/**
 * Sets the current user data in context
 * @param {Object} userData - User data object to set
 * @returns {boolean} True if set successfully
 */
const setCurrentUserData = (userData) => {
  return setContextValue(CONTEXT_KEYS.USER_DATA, userData);
};

/**
 * Sets the current session ID in context
 * @param {string} sessionId - Session ID to set
 * @returns {boolean} True if set successfully
 */
const setCurrentSessionId = (sessionId) => {
  return setContextValue(CONTEXT_KEYS.SESSION_ID, sessionId);
};

/**
 * Sets the current IP address in context
 * @param {string} ipAddress - IP address to set
 * @returns {boolean} True if set successfully
 */
const setCurrentIpAddress = (ipAddress) => {
  return setContextValue(CONTEXT_KEYS.IP_ADDRESS, ipAddress);
};

/**
 * Sets the current user agent in context
 * @param {string} userAgent - User agent string to set
 * @returns {boolean} True if set successfully
 */
const setCurrentUserAgent = (userAgent) => {
  return setContextValue(CONTEXT_KEYS.USER_AGENT, userAgent);
};

/**
 * Sets the current user permissions in context
 * @param {Array} permissions - Array of permissions to set
 * @returns {boolean} True if set successfully
 */
const setCurrentPermissions = (permissions) => {
  return setContextValue(CONTEXT_KEYS.PERMISSIONS, Array.isArray(permissions) ? permissions : []);
};

/**
 * Sets the current user roles in context
 * @param {Array} roles - Array of roles to set
 * @returns {boolean} True if set successfully
 */
const setCurrentRoles = (roles) => {
  return setContextValue(CONTEXT_KEYS.ROLES, Array.isArray(roles) ? roles : []);
};

/**
 * Sets the current tenant ID in context
 * @param {string} tenantId - Tenant ID to set
 * @returns {boolean} True if set successfully
 */
const setCurrentTenantId = (tenantId) => {
  return setContextValue(CONTEXT_KEYS.TENANT_ID, tenantId);
};

// =============================================================================
// CUSTOM DATA MANAGEMENT
// =============================================================================

/**
 * Gets custom data from context
 * @param {string} key - Custom data key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Custom data value or default
 */
const getCustomData = (key, defaultValue = null) => {
  try {
    const customData = getContextValue(CONTEXT_KEYS.CUSTOM_DATA, {});
    return customData.prototype.hasOwnProperty.call(key) ? customData[key] : defaultValue;
  } catch (error) {
    throw new Error(`Failed to get custom data for key '${key}': ${error.message}`);
  }
};

/**
 * Sets custom data in context
 * @param {string} key - Custom data key
 * @param {any} value - Value to set
 * @returns {boolean} True if set successfully
 */
const setCustomData = (key, value) => {
  try {
    const customData = getContextValue(CONTEXT_KEYS.CUSTOM_DATA, {});
    customData[key] = sanitizeContextData(value);
    return setContextValue(CONTEXT_KEYS.CUSTOM_DATA, customData);
  } catch (error) {
    throw new Error(`Failed to set custom data for key '${key}': ${error.message}`);
  }
};

/**
 * Removes custom data from context
 * @param {string} key - Custom data key to remove
 * @returns {boolean} True if removed successfully
 */
const removeCustomData = (key) => {
  try {
    const customData = getContextValue(CONTEXT_KEYS.CUSTOM_DATA, {});
    delete customData[key];
    return setContextValue(CONTEXT_KEYS.CUSTOM_DATA, customData);
  } catch (error) {
    throw new Error(`Failed to remove custom data for key '${key}': ${error.message}`);
  }
};

/**
 * Gets all custom data from context
 * @returns {Object} All custom data
 */
const getAllCustomData = () => {
  return getContextValue(CONTEXT_KEYS.CUSTOM_DATA, {});
};

// =============================================================================
// PERMISSION AND ROLE MANAGEMENT
// =============================================================================

/**
 * Checks if the current user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
const hasPermission = (permission) => {
  try {
    const permissions = getCurrentPermissions();
    return permissions.includes(permission);
  } catch (error) {
    throw new Error(`Failed to check permission '${permission}': ${error.message}`);
  }
};

/**
 * Checks if the current user has any of the specified permissions
 * @param {Array} permissionList - Array of permissions to check
 * @returns {boolean} True if user has any of the permissions
 */
const hasAnyPermission = (permissionList) => {
  try {
    const permissions = getCurrentPermissions();
    return permissionList.some((permission) => permissions.includes(permission));
  } catch (error) {
    throw new Error(`Failed to check permissions: ${error.message}`);
  }
};

/**
 * Checks if the current user has all specified permissions
 * @param {Array} permissionList - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
const hasAllPermissions = (permissionList) => {
  try {
    const permissions = getCurrentPermissions();
    return permissionList.every((permission) => permissions.includes(permission));
  } catch (error) {
    throw new Error(`Failed to check permissions: ${error.message}`);
  }
};

/**
 * Checks if the current user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has role
 */
const hasRole = (role) => {
  try {
    const roles = getCurrentRoles();
    return roles.includes(role);
  } catch (error) {
    throw new Error(`Failed to check role '${role}': ${error.message}`);
  }
};

/**
 * Checks if the current user has any of the specified roles
 * @param {Array} roleList - Array of roles to check
 * @returns {boolean} True if user has any of the roles
 */
const hasAnyRole = (roleList) => {
  try {
    const roles = getCurrentRoles();
    return roleList.some((role) => roles.includes(role));
  } catch (error) {
    throw new Error(`Failed to check roles: ${error.message}`);
  }
};

/**
 * Adds a permission to the current user's context
 * @param {string} permission - Permission to add
 * @returns {boolean} True if added successfully
 */
const addPermission = (permission) => {
  try {
    const permissions = getCurrentPermissions();
    if (!permissions.includes(permission)) {
      permissions.push(permission);
      return setCurrentPermissions(permissions);
    }
    return true;
  } catch (error) {
    throw new Error(`Failed to add permission '${permission}': ${error.message}`);
  }
};

/**
 * Removes a permission from the current user's context
 * @param {string} permission - Permission to remove
 * @returns {boolean} True if removed successfully
 */
const removePermission = (permission) => {
  try {
    const permissions = getCurrentPermissions();
    const filteredPermissions = permissions.filter((p) => p !== permission);
    return setCurrentPermissions(filteredPermissions);
  } catch (error) {
    throw new Error(`Failed to remove permission '${permission}': ${error.message}`);
  }
};

// =============================================================================
// CONTEXT DEBUGGING AND LOGGING
// =============================================================================

/**
 * Gets a summary of the current context for debugging
 * @param {boolean} includeCustomData - Whether to include custom data
 * @returns {Object} Context summary
 */
const getContextSummary = (includeCustomData = false) => {
  try {
    const context = getContext();
    if (!context) {
      return { error: 'No active context' };
    }

    const summary = {
      userId: context[CONTEXT_KEYS.USER_ID] || 'Not set',
      sessionId: context[CONTEXT_KEYS.SESSION_ID] || 'Not set',
      requestId: context[CONTEXT_KEYS.REQUEST_ID] || 'Not set',
      timestamp: context[CONTEXT_KEYS.TIMESTAMP] || 'Not set',
      permissions: (context[CONTEXT_KEYS.PERMISSIONS] || []).length,
      roles: (context[CONTEXT_KEYS.ROLES] || []).length,
      tenantId: context[CONTEXT_KEYS.TENANT_ID] || 'Not set',
    };

    if (includeCustomData) {
      summary.customData = context[CONTEXT_KEYS.CUSTOM_DATA] || {};
    }

    return summary;
  } catch (error) {
    return { error: `Failed to get context summary: ${error.message}` };
  }
};

/**
 * Validates the current context structure
 * @returns {Object} Validation result with any issues found
 */
const validateContext = () => {
  try {
    const context = getContext();
    const issues = [];

    if (!context) {
      return { isValid: false, issues: ['No active context found'] };
    }

    if (!context[CONTEXT_KEYS.TIMESTAMP]) {
      issues.push('Missing timestamp');
    }

    if (!context[CONTEXT_KEYS.REQUEST_ID]) {
      issues.push('Missing request ID');
    }

    if (context[CONTEXT_KEYS.PERMISSIONS] && !Array.isArray(context[CONTEXT_KEYS.PERMISSIONS])) {
      issues.push('Permissions should be an array');
    }

    if (context[CONTEXT_KEYS.ROLES] && !Array.isArray(context[CONTEXT_KEYS.ROLES])) {
      issues.push('Roles should be an array');
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Validation failed: ${error.message}`],
    };
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Core Context Management
  runWithContext,
  getContext,
  hasContext,
  clearContext,

  // Generic Getters
  getContextValue,
  getContextValues,

  // Specific Getters
  getCurrentUserId,
  getCurrentUserData,
  getCurrentSessionId,
  getCurrentRequestId,
  getCurrentIpAddress,
  getCurrentUserAgent,
  getCurrentTimestamp,
  getCurrentPermissions,
  getCurrentRoles,
  getCurrentTenantId,
  getCurrentCorrelationId,

  // Generic Setters
  setContextValue,
  setContextValues,

  // Specific Setters
  setCurrentUserId,
  setCurrentUserData,
  setCurrentSessionId,
  setCurrentIpAddress,
  setCurrentUserAgent,
  setCurrentPermissions,
  setCurrentRoles,
  setCurrentTenantId,

  // Custom Data Management
  getCustomData,
  setCustomData,
  removeCustomData,
  getAllCustomData,

  // Permission and Role Management
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  addPermission,
  removePermission,

  // Debugging and Validation
  getContextSummary,
  validateContext,
};
