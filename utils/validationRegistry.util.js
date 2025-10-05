// =============================================================================
// VALIDATION SCHEMA REGISTRY - Express Validator Schema Management
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Provides automatic registration and tracking of Express validation schemas
// - Wraps express-validator's checkSchema to capture schema metadata automatically
// - Enables schema discovery and retrieval for API documentation and testing
// - Expected inputs: Express request objects with route information
// - Expected outputs: Validation middleware with schema registration capabilities
//
// ARCHITECTURAL DECISIONS:
// - Chose wrapper pattern to maintain compatibility with existing express-validator API
// - Used global registry pattern for simplicity and single source of truth
// - Implemented route-based key generation to handle duplicate path detection
// - Selected middleware interception approach to capture route context automatically
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Decorator pattern: More intrusive but could provide better type safety (rejected for complexity)
// - Manual registration: More explicit but prone to human error and maintenance issues
// - Proxy-based approach: More elegant but harder to debug and potential performance overhead
// - Database-backed registry: More scalable but overkill for most use cases
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for schema registration, O(n) for schema lookup
// - Space complexity: O(n) where n is number of registered routes
// - Scalability: Suitable for applications with hundreds of routes, consider Redis for larger scale
// - Memory usage: Minimal overhead per route (method, path, schema reference)
//
// SECURITY CONSIDERATIONS:
// - No sensitive data stored in registry (only schema definitions)
// - Input validation handled by express-validator, not this module
// - Route information is public metadata, no security risk in exposure
// - Schema definitions should not contain sensitive information
//
// USAGE EXAMPLES:
// - Basic usage: Replace checkSchema with checkSchemaWithRegistry
// - Schema discovery: Use getRegisteredSchemas for API documentation generation
// - Route-specific lookup: Use getSchemaForRoute for testing and validation
// - Testing: Use clearSchemas to reset state between test runs
//
// MAINTENANCE & TROUBLESHOOTING:
// - Common issue: Route path mismatch due to Express route mounting
// - Debugging: Check baseUrl and route.path concatenation for full path resolution
// - Memory leaks: Use clearSchemas in long-running tests to prevent state accumulation
// - Enhancement: Consider adding schema versioning for breaking changes
//
// DEPENDENCIES & COMPATIBILITY:
// - Required: Express.js 4.x+, express-validator 6.x+
// - Node.js: Compatible with Node.js 12+ (ES6 features used)
// - Browser: Not applicable (server-side only)
// - Environment: Works in development, testing, and production
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { checkSchema } = require('express-validator'); // Express validation schema middleware

// =============================================================================
// GLOBAL REGISTRY STORAGE
// =============================================================================

/**
 * Global registry storing all validation schemas with their route metadata
 * @type {Array<Object>}
 * @private
 *
 * @property {string} key - Unique identifier combining HTTP method and path
 * @property {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @property {string} path - Full route path including base URL
 * @property {Object} schema - Express validator schema definition
 */
const validationSchemas = [];

// =============================================================================
// SCHEMA REGISTRY FUNCTIONS
// =============================================================================

/**
 * Enhanced checkSchema wrapper with automatic schema registration
 *
 * @description Wraps express-validator's checkSchema function to automatically
 * capture and register validation schemas with their corresponding route metadata.
 * Maintains full compatibility with existing checkSchema API while adding
 * automatic registration capabilities.
 *
 * @param {Object} schema - Express validator schema definition object
 * @returns {Array<Function>} Array of Express middleware functions including
 *                            capture middleware and validation middlewares
 *
 * @example
 * // Basic usage (drop-in replacement for checkSchema)
 * router.post('/users',
 *   checkSchemaWithRegistry(userValidationSchema),
 *   userController.createUser
 * );
 *
 * @example
 * // Complex usage with multiple validators
 * router.put('/users/:id',
 *   authenticate,
 *   checkSchemaWithRegistry(updateUserSchema),
 *   checkSchemaWithRegistry(profileSchema),
 *   userController.updateUser
 * );
 *
 * @complexity Time: O(1) for registration, Space: O(1) per route
 * @since Version 1.0.0
 * @see {@link https://express-validator.github.io/docs/check-schema.html} for base checkSchema documentation
 */
const checkSchemaWithRegistry = (schema) => {
  const middlewares = checkSchema(schema);

  /**
   * Custom middleware to capture route information and register schema
   * @param {Object} req - Express request object
   * @param {Object} _ - Express response object (unused)
   * @param {Function} next - Express next middleware function
   * @private
   */
  const captureMiddleware = (req, _, next) => {
    // Extract route information from Express request object
    const route = req.route;
    const baseUrl = req.baseUrl || '';

    // Only register if route information is available
    if (route && route.path) {
      const fullPath = baseUrl + route.path;
      const method = Object.keys(route.methods)[0]?.toUpperCase() || 'UNKNOWN';
      const key = `${method} ${fullPath}`;

      // Prevent duplicate registrations for the same route
      const exists = validationSchemas.some((s) => s.key === key);

      if (!exists) {
        validationSchemas.push({
          key,
          method,
          path: fullPath,
          schema,
        });
      }
    }

    next();
  };

  // Return capture middleware followed by validation middlewares
  return [captureMiddleware, ...middlewares];
};

/**
 * Retrieves all registered validation schemas with their metadata
 *
 * @description Returns a copy of all registered schemas with method, path, and schema
 * information. Useful for generating API documentation, testing, and debugging.
 *
 * @returns {Array<Object>} Array of schema objects with method, path, and schema properties
 *
 * @example
 * // Generate OpenAPI documentation from registered schemas
 * const schemas = getRegisteredSchemas();
 * schemas.forEach(({ method, path, schema }) => {
 *   console.log(`${method} ${path}:`, Object.keys(schema));
 * });
 *
 * @example
 * // Use in testing to verify schema registration
 * describe('Schema Registration', () => {
 *   it('should register all API endpoints', () => {
 *     const schemas = getRegisteredSchemas();
 *     expect(schemas.length).toBeGreaterThan(0);
 *   });
 * });
 *
 * @complexity Time: O(n) where n is number of registered schemas
 * @since Version 1.0.0
 */
const getRegisteredSchemas = () => {
  return validationSchemas.map(({ method, path, schema }) => ({
    method,
    path,
    schema,
  }));
};

/**
 * Finds validation schema for a specific route
 *
 * @description Looks up a registered validation schema by HTTP method and path.
 * Useful for testing specific endpoints or generating route-specific documentation.
 *
 * @param {string} method - HTTP method (case-insensitive)
 * @param {string} path - Route path to match
 * @returns {Object|null} Validation schema object if found, null otherwise
 *
 * @example
 * // Look up schema for specific route
 * const userSchema = getSchemaForRoute('POST', '/api/users');
 * if (userSchema) {
 *   console.log('User validation rules:', userSchema);
 * }
 *
 * @example
 * // Use in route testing
 * describe('User API', () => {
 *   it('should have validation for user creation', () => {
 *     const schema = getSchemaForRoute('POST', '/api/users');
 *     expect(schema).toBeDefined();
 *     expect(schema.email).toBeDefined();
 *   });
 * });
 *
 * @complexity Time: O(n) where n is number of registered schemas
 * @since Version 1.0.0
 */
const getSchemaForRoute = (method, path) => {
  const key = `${method.toUpperCase()} ${path}`;
  const found = validationSchemas.find((s) => s.key === key);
  return found ? found.schema : null;
};

/**
 * Clears all registered schemas from the registry
 *
 * @description Resets the schema registry by removing all registered schemas.
 * Primarily useful for testing scenarios to ensure clean state between test runs.
 * Use with caution in production environments.
 *
 * @example
 * // Use in test cleanup
 * afterEach(() => {
 *   clearSchemas();
 * });
 *
 * @example
 * // Reset for dynamic schema reloading
 * function reloadSchemas() {
 *   clearSchemas();
 *   // Re-register updated schemas
 *   app.use('/api', updatedRoutes);
 * }
 *
 * @complexity Time: O(1), Space: O(1)
 * @since Version 1.0.0
 */
const clearSchemas = () => {
  validationSchemas.length = 0;
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  checkSchemaWithRegistry,
  getRegisteredSchemas,
  getSchemaForRoute,
  clearSchemas,
};
