// =============================================================================
// SWAGGER PAGINATION & SEARCH PARAMETERS - OpenAPI Specification Definitions
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Defines standardized OpenAPI 3.0 parameters for pagination and search operations
// - Provides reusable parameter definitions for API endpoints supporting paginated search
// - Ensures consistent parameter validation and documentation across API endpoints
// - Expected input: HTTP query parameters for pagination and search criteria
// - Expected output: Structured OpenAPI parameters for automatic documentation generation
//
// ARCHITECTURAL DECISIONS:
// - Modular design allows separation of pagination and search parameters for reusability
// - Follows OpenAPI Specification 3.0 standard for parameter definition
// - Uses schema validation to enforce parameter constraints at specification level
// - Designed for integration with Swagger UI and OpenAPI code generation tools
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative 1: Inline parameter definitions (rejected - reduces reusability)
// - Alternative 2: Separate files per parameter type (rejected - increases complexity)
// - Alternative 3: Centralized parameter registry (rejected - over-engineering for current needs)
// - Chosen approach provides optimal balance between reusability and simplicity
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for parameter definition loading
// - Space complexity: Minimal static configuration memory usage
// - No runtime performance impact (compile-time documentation only)
//
// SECURITY CONSIDERATIONS:
// - Input validation enforced through OpenAPI schema constraints
// - Maximum page size limit (100) prevents denial-of-service through large queries
// - No sensitive data exposure through parameters
// - SQL injection prevention must be implemented at handler level
//
// USAGE EXAMPLES:
// - Basic usage in Express route definition:
//   router.get('/users', async (req, res) => {
//     const { page = 1, limit = 10, search } = req.query;
//     // Implementation using parameters
//   });
//
// - Swagger/OpenAPI integration:
//   parameters:
//     - $ref: '#/components/parameters/paginationParameters'
//
// MAINTENANCE & TROUBLESHOOTING:
// - Common errors: Missing search.params module, schema validation failures
// - Parameters must be updated in sync with actual handler validation logic
// - Maximum limit value should match backend validation rules
//
// DEPENDENCIES & COMPATIBILITY:
// - Compatible with OpenAPI Specification 3.0+
// - Requires consistent search.params module interface
// - Node.js 12+ required for object spread syntax
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const searchParams = require('./search.params'); // Search/filter parameter definitions

/**
 * OpenAPI Pagination Parameters Specification
 * @description Comprehensive parameter definitions for paginated API endpoints
 * combining both pagination controls and search parameters. Designed for
 * integration with Swagger documentation and OpenAPI code generation tools.
 *
 * @type {Array<Object>} OpenAPI parameter objects conforming to OpenAPI 3.0 specification
 *
 * @property {Object} limit - Pagination limit parameter
 * @property {Object} page - Pagination page number parameter
 * @property {...Object} searchParams - Expanded search parameters from external module
 *
 * @example
 * // Swagger route configuration using these parameters
 * app.get('/api/v1/resources', {
 *   parameters: paginationParameters,
 *   handler: (req, res) => { /* implementation *\/ }
 * });
 *
 * @since Version 1.0.0
 * @see {@link module:search.params} for search parameter definitions
 */
const paginationParameters = [
  {
    name: 'limit',
    in: 'query',
    description:
      '**[Optional]** Specifies the maximum number of records to return per page. Defaults to 10 if not provided. Must be used in conjunction with `page`. Maximum allowed value: 100 records per page.',
    schema: { type: 'integer', minimum: 1, maximum: 100, example: 10 },
    required: false,
  },
  {
    name: 'page',
    in: 'query',
    description:
      '**[Optional]** Indicates the page number of results to retrieve. Defaults to the first page if not provided. Must be used in conjunction with `limit`. Minimum value: 1',
    schema: { type: 'integer', minimum: 1, example: 1 },
    required: false,
  },
  // Expand search parameters from external module
  // Maintains separation of concerns while combining related parameter sets
  ...searchParams,
];

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = paginationParameters;
