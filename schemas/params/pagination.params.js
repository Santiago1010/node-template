// =============================================================================
// PAGINATION PARAMETERS - OpenAPI/Swagger Specification
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Defines standardized OpenAPI 3.0 parameters for pagination and search operations
// - Provides reusable parameter definitions for API endpoints supporting pagination
// - Ensures consistent pagination behavior across multiple API endpoints
// - Expected input: HTTP query parameters
// - Expected output: Structured OpenAPI parameters specification
//
// ARCHITECTURAL DECISIONS:
// - Follows OpenAPI Specification 3.0 for parameter definition
// - Uses modular design to separate pagination from search parameters
// - Implements parameter reusability through module composition
// - Adheres to REST API best practices for pagination (limit/offset pattern)
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Cursor-based pagination: Considered but rejected due to simpler implementation
//   requirements and compatibility with existing frontend components
// - Page-number only: Rejected due to lack of flexibility in page sizing
// - Offset-based without limit: Rejected as it doesn't support page size control
// - Integrated search/pagination parameters: Rejected in favor of modular separation
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) - Constant time parameter definition
// - Space complexity: O(n) - Linear to number of combined parameters
// - Scalability: Suitable for high-volume APIs with proper indexing
// - Benchmark: Parameters add negligible overhead to request processing
//
// SECURITY CONSIDERATIONS:
// - Input validation: Must validate integer parameters server-side
// - SQL injection: Parameters require proper parameterization in queries
// - Maximum limits: Should enforce reasonable upper bounds for limit parameter
// - Data exposure: Ensure pagination doesn't expose unauthorized records
//
// USAGE EXAMPLES:
// - Basic usage in Express route:
//   router.get('/users', (req, res) => {
//     const { limit = 10, page = 1 } = req.query;
//     // Implement pagination logic
//   });
//
// - OpenAPI integration:
//   paths:
//     /users:
//       get:
//         parameters:
//           - $ref: '#/components/parameters/paginationParameters'
//
// MAINTENANCE & TROUBLESHOOTING:
// - Common errors: Missing companion parameters (page without limit or vice versa)
// - Validation: Always validate parameters before database query
// - Versioning: Changes may affect multiple endpoints simultaneously
// - Monitoring: Track pagination usage patterns for optimization
//
// DEPENDENCIES & COMPATIBILITY:
// - Compatible with OpenAPI 3.0+ specifications
// - Requires Express.js or similar web framework
// - Dependent on search.params module interface
// - Node.js 12+ due to object spread syntax
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const searchParams = require('./search.params'); // Search-related parameter definitions

/**
 * OpenAPI Pagination Parameters Specification
 * @description Comprehensive parameter definitions for standardized API pagination.
 * Combines pagination parameters (limit/page) with search parameters from external module.
 *
 * @type {Array<Object>} OpenAPI parameter objects
 * @property {Object} limit - Pagination limit parameter configuration
 * @property {Object} page - Pagination page number parameter configuration
 * @property {Array} ...searchParams - Expanded search parameters from external module
 *
 * @example
 * // Import into OpenAPI specification
 * components:
 *   parameters:
 *     paginationParams:
 *       $ref: './path/to/this/module'
 *
 * @example
 * // Direct usage in route definition
 * app.get('/api/records', validateParams(paginationParameters), (req, res) => {
 *   // Handle paginated request
 * });
 *
 * @since 1.0.0
 * @see {@link ./search.params} for search parameter definitions
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
      '**[Optional]** Indicates the page number of results to retrieve. Defaults to the first page if not provided. Must be used in conjunction with `limit`.  Minimum value: 1',
    schema: { type: 'integer', minimum: 1, example: 1 },
    required: false,
  },
  // Expand search parameters from external module
  ...searchParams,
];

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = paginationParameters;
