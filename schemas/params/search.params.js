// =============================================================================
// API SEARCH PARAMETERS - OpenAPI/Swagger Query Parameter Configuration
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Defines standardized search parameter configuration for OpenAPI/Swagger documentation
// - Provides declarative specification for API endpoint query parameters
// - Enables automatic API documentation generation and client SDK generation
//
// ARCHITECTURAL DECISIONS:
// - Uses OpenAPI 3.0 parameter specification format for tooling compatibility
// - Follows RESTful API best practices for search/filter implementation
// - Decouples parameter definition from implementation logic
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative: Hardcode parameters in each endpoint documentation
//   → Rejected due to duplication and maintenance overhead
// - Alternative: Implement custom parameter validation system
//   → Rejected to maintain OpenAPI spec compliance and tooling benefits
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for parameter definition lookup
// - Space complexity: Minimal constant space for configuration storage
//
// SECURITY CONSIDERATIONS:
// - Parameter implements optional validation through utilities.helper.js
// - Search input should be sanitized against NoSQL/JS injection attacks
// - Consider rate limiting search endpoints to prevent exhaustive searches
//
// USAGE EXAMPLES:
// - Integrated with OpenAPI documentation generators like swagger-jsdoc
// - Used by automated testing frameworks for parameter validation
// - Consumed by API clients for automatic SDK generation
//
// MAINTENANCE & TROUBLESHOOTING:
// - Update description field when search functionality changes
// - Maintain synchronization with actual validation logic in utilities.helper.js
// - Verify required status matches actual API requirements
//
// DEPENDENCIES & COMPATIBILITY:
// - Compatible with OpenAPI 3.0+ specification
// - Requires accompanying validation logic in @helpers/database/utilities.helper.js
//
// =============================================================================

/**
 * OpenAPI Search Parameter Configuration
 *
 * @description Standardized search parameter definition for API endpoints.
 * Configures a universal search parameter that filters records by matching
 * the specified string across all available fields. The actual search
 * implementation is handled by the search utility in utilities.helper.js.
 *
 * @type {Array<Object>} OpenAPI-compliant parameter specification objects
 *
 * @property {string} name - Parameter identifier: 'search'
 * @property {string} in - Parameter location: 'query'
 * @property {string} description - Comprehensive usage documentation
 * @property {Object} schema - Expected data type: {type: 'string'}
 * @property {boolean} required - Parameter requirement status: false
 *
 * @example
 * // Integration with OpenAPI documentation
 * const express = require('express');
 * const router = express.Router();
 *
 * /**
 *  * @openapi
 *  * /api/endpoint:
 *  *   get:
 *  *     parameters:
 *  *       - $ref: '#/components/parameters/searchParam'
 *  *
 *  *
 *  *
 * @example
 * // Client-side usage
 * fetch('/api/records?search=term');
 *
 * @see {@link module:@helpers/database/utilities.helper.js} for implementation details
 * @since Version 1.0.0
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
