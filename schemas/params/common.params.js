// =============================================================================
// OpenAPI Parameter Configuration - Common API Parameter Definitions
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Provides standardized OpenAPI 3.0 parameter definitions for RESTful APIs
// - Ensures consistent filtering, pagination, and field selection across endpoints
// - Serves as reusable parameter specifications for Swagger/OpenAPI documentation
// - Expected input: Parameter configurations for HTTP query/path parameters
// - Expected output: Structured OpenAPI parameter objects for API documentation
//
// ARCHITECTURAL DECISIONS:
// - Modular design allows selective parameter combination for different endpoints
// - Separation of concerns between parameter types (filtering, pagination, fields)
// - Compliance with OpenAPI 3.0 specification for automated documentation generation
// - Integration with Swagger UI for interactive API exploration and testing
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative: Inline parameter definitions in each route handler
//   - Trade-off: Leads to code duplication and inconsistent parameter definitions
//   - Rationale: Rejected in favor of centralized, reusable parameter configuration
//
// - Alternative: Automatic parameter generation from JSON Schema
//   - Trade-off: Increased complexity and reduced explicit control over documentation
//   - Rationale: Rejected due to need for precise, human-readable descriptions
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for parameter access and combination
// - Space complexity: Minimal memory footprint for parameter definitions
// - Scalability: Linear scaling with number of parameter definitions
//
// SECURITY CONSIDERATIONS:
// - Input validation: Parameters should be validated against injection attacks
// - Field exposure: Careful consideration needed for field selection to prevent data leakage
// - ID filtering: Should validate user permissions for requested resources
//
// USAGE EXAMPLES:
// - Basic list endpoint with pagination and filtering:
//   router.get('/users', validate(commonListParams), userController.list);
//
// - Detail endpoint with history option:
//   router.get('/users/:identifier', validate(detailsParams), userController.detail);
//
// MAINTENANCE & TROUBLESHOOTING:
// - Parameter modifications should maintain backward compatibility
// - New parameters should follow existing naming conventions
// - Changes should be reflected in all consuming endpoints
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires OpenAPI 3.0 compliant documentation tools
// - Compatible with Express.js and other Node.js web frameworks
// - Works with swagger-ui-express and similar documentation renderers
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
// None - Pure configuration module

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
// None - Self-contained parameter definitions

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const paginationParameters = require('./pagination.params'); // Standard pagination parameters (limit, offset, page)

/**
 * ID-based filter parameters for collection endpoints
 * @type {Array<Object>}
 * @description Provides filtering capability by primary IDs in comma-separated format
 * @example
 * // Usage in URL: GET /resources?ids=1,2,3,4
 */
const idsFilter = [
  {
    name: 'ids',
    in: 'query',
    description:
      '**[Optional]** Filters records by their primary IDs. Provide a comma-separated list of IDs (e.g., `1,2,3,4`). If not provided, no filtering by IDs will be applied.',
    schema: { type: 'string' },
    required: false,
  },
];

/**
 * Field selection parameters for response shaping
 * @type {Array<Object>}
 * @description Controls field inclusion/exclusion in API responses using comma-separated field names
 * @example
 * // Usage in URL: GET /resources?fields=id,name,created_at
 */
const fieldsFilter = [
  {
    name: 'fields',
    in: 'query',
    description:
      '**[Optional]** Specifies the fields to include in the response. Provide a comma-separated list of field names (e.g., `id,created_at,updated_at,deleted_at`). If not provided, all fields will be returned.',
    schema: { type: 'string' },
    required: false,
  },
];

/**
 * Detail endpoint parameters for single resource retrieval
 * @type {Array<Object>}
 * @description Combines path parameter, field selection, and history inclusion options
 * @example
 * // Usage in URL: GET /resources/123?includeHistory=true&fields=id,name,history
 */
const detailsParams = [
  {
    name: 'identifier',
    in: 'path',
    description: '**[Required]** Unique identifier of the record.',
    schema: { type: 'integer' },
    required: true,
  },
  ...fieldsFilter,
  {
    name: 'includeHistory',
    in: 'query',
    description:
      '**[Optional]** If set to `true`, the history of the record will be included in the response. If not provided, the history will not be included.',
    schema: { type: 'boolean', enum: [true, false], default: false },
    required: false,
  },
];

/**
 * Active status filter parameter for soft-delete implementations
 * @type {Array<Object>}
 * @description Filters resources based on their active/inactive status in systems with soft deletion
 * @example
 * // Usage in URL: GET /resources?active=false
 */
const activeParams = [
  {
    name: 'active',
    in: 'query',
    description:
      '**[Optional]** If set to `true`, only active records will be returned; if set to `false`, only inactive records will be returned. If not provided, all records will be returned.',
    schema: { type: 'boolean', enum: [true, false] },
    required: false,
  },
];

/**
 * Standard parameter set for collection endpoints
 * @type {Array<Object>}
 * @description Comprehensive parameter combination for list endpoints including pagination, ID filtering, and field selection
 * @example
 * // Usage in URL: GET /resources?limit=10&offset=20&ids=1,2,3&fields=id,name
 */
const commonListParams = [...paginationParameters, ...idsFilter, ...fieldsFilter];

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  /**
   * ID-based filtering parameters
   * @type {Array<Object>}
   */
  idsFilter,

  /**
   * Field selection parameters
   * @type {Array<Object>}
   */
  fieldsFilter,

  /**
   * Single resource retrieval parameters
   * @type {Array<Object>}
   */
  detailsParams,

  /**
   * Active status filtering parameters
   * @type {Array<Object>}
   */
  activeParams,

  /**
   * Complete parameter set for collection endpoints
   * @type {Array<Object>}
   */
  commonListParams,
};
