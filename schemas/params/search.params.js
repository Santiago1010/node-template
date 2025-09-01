// =============================================================================
// SWAGGER SEARCH PARAMETERS - OpenAPI Search Parameter Specification
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Defines standardized OpenAPI 3.0 parameter for search operations in API endpoints
// - Provides reusable parameter definition for endpoints supporting text-based search
// - Ensures consistent search parameter validation and documentation across the API
// - Expected input: HTTP query parameter 'search' with string value
// - Expected output: Structured OpenAPI parameter for automatic documentation generation
//
// ARCHITECTURAL DECISIONS:
// - Single-purpose module focused exclusively on search parameter definition
// - Follows OpenAPI Specification 3.0 standard for parameter definition
// - Uses schema validation to enforce maximum search term length (256 characters)
// - Designed for integration with Swagger UI and OpenAPI code generation tools
// - Maintains separation of concerns from pagination and other parameter types
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative 1: Combined parameter module (rejected - reduces modularity)
// - Alternative 2: Dynamic parameter generation (rejected - over-engineering)
// - Alternative 3: Inline parameter definitions (rejected - reduces reusability)
// - Chosen approach provides optimal modularity and reusability for search functionality
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for parameter definition loading
// - Space complexity: Minimal static configuration memory usage
// - No runtime performance impact (compile-time documentation only)
//
// SECURITY CONSIDERATIONS:
// - Input validation enforced through OpenAPI schema constraints (maxLength: 256)
// - Prevents excessively long search terms that could impact database performance
// - Search implementation must properly sanitize inputs to prevent injection attacks
// - No authentication/authorization concerns at parameter definition level
//
// USAGE EXAMPLES:
// - Basic usage in Express route definition:
//   router.get('/products', async (req, res) => {
//     const { search } = req.query;
//     // Implementation using search parameter
//   });
//
// - Swagger/OpenAPI integration:
//   parameters:
//     - $ref: '#/components/parameters/searchParameters'
//
// - Multiple parameter combination:
//   parameters:
//     - $ref: '#/components/parameters/searchParameters'
//     - $ref: '#/components/parameters/paginationParameters'
//
// MAINTENANCE & TROUBLESHOOTING:
// - Maximum length constraint must match backend validation rules
// - Search functionality implementation must align with parameter description
// - Changes to search helper utility should be reflected in parameter documentation
//
// DEPENDENCIES & COMPATIBILITY:
// - Compatible with OpenAPI Specification 3.0+
// - References external search utility: @helpers/database/utilities.helper.js
// - Node.js 12+ required for module syntax
// =============================================================================

/**
 * OpenAPI Search Parameter Specification
 * @description Standardized parameter definition for text-based search functionality
 * in API endpoints. Defines a reusable search parameter that can be integrated
 * into multiple endpoint definitions for consistent search behavior documentation.
 *
 * @type {Array<Object>} OpenAPI parameter object conforming to OpenAPI 3.0 specification
 *
 * @property {Object} search - Search parameter definition
 * @property {string} search.name - Parameter name: 'search'
 * @property {string} search.in - Parameter location: 'query'
 * @property {string} search.description - Comprehensive usage documentation
 * @property {Object} search.schema - Parameter validation schema
 * @property {boolean} search.required - Parameter requirement flag
 *
 * @example
 * // Swagger route configuration using search parameter
 * app.get('/api/v1/products', {
 *   parameters: searchParams,
 *   handler: (req, res) => {
 *     const { search } = req.query;
 *     // Implement search functionality
 *   }
 * });
 *
 * @since Version 1.0.0
 * @see {@link module:@helpers/database/utilities.helper.js} for search implementation
 */
const searchParams = [
  {
    name: 'search',
    in: 'query',
    description:
      '**[Optional]** Filters records by searching for the specified string in all fields. Only records containing the string will be displayed. Uses the `search` function from `@helpers/database/utilities.helper.js`. Supports partial matches and case-insensitive search. Maximum search term length: 256 characters.',
    schema: { type: 'string', maxLength: 256 },
    required: false,
  },
];

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = searchParams;
