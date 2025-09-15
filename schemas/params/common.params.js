// =============================================================================
// API PARAMETER DEFINITIONS - Swagger/OpenAPI Specification Components
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Provides standardized parameter definitions for Swagger/OpenAPI documentation
// - Enforces consistent filtering, pagination, and field selection across API endpoints
// - Serves as reusable components for API specification documentation
//
// ARCHITECTURAL DECISIONS:
// - Modular design allows independent use of parameter groups
// - Follows OpenAPI Specification 3.0 standard for parameter definition
// - Supports RESTful best practices for filtering and pagination
// - Enables automatic API documentation generation through Swagger UI
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative: Inline parameter definitions in each endpoint
//   → Rejected due to code duplication and maintenance overhead
// - Alternative: Centralized JSON Schema definitions
//   → Rejected due to reduced readability and Node.js integration needs
// - Alternative: Code-generated parameters
//   → Rejected due to complexity overhead for simple parameter definitions
//
// PERFORMANCE CHARACTERISTICS:
// - Zero runtime impact (documentation-only components)
// - Minimal memory footprint (static array definitions)
// - Instant initialization time (O(1) complexity)
//
// SECURITY CONSIDERATIONS:
// - Input validation must be implemented separately in route handlers
// - IDs parameter requires sanitization to prevent injection attacks
// - Fields parameter should validate against actual schema fields
// - Boolean parameters require strict validation to prevent type confusion
//
// USAGE EXAMPLES:
// - Basic collection endpoint:
//   @swagger.path = {
//     get: {
//       parameters: [...commonListParams]
//     }
//   }
//
// - Detail endpoint with history:
//   @swagger.path = {
//     get: {
//       parameters: [...detailsParams]
//     }
//   }
//
// MAINTENANCE & TROUBLESHOOTING:
// - Add new parameters by extending relevant arrays
// - Maintain consistent description format across all parameters
// - Update documentation when adding new field options
// - Verify parameter combinations in endpoint tests
//
// DEPENDENCIES & COMPATIBILITY:
// - Compatible with OpenAPI Specification 3.0+
// - Requires Swagger UI or compatible documentation renderer
// - Works with any Node.js web framework (Express, Koa, etc.)
//
// CHANGE LOG:
// - [2024-01-15] Added activeBody schema definition for request bodies
// - [2024-01-10] Initial version with common parameter sets
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const paginationParameters = require('./pagination.params'); // Standard pagination parameters (limit, offset, page)

/**
 * ID Filter Parameters
 * @description Provides comma-separated ID filtering for bulk operations
 * @type {Array<Object>}
 * @constant
 *
 * @example
 * // Usage in Swagger documentation
 * parameters: [...idsFilter]
 *
 * @example
 * // API request example
 * GET /resources?ids=1,2,3,4
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
 * Field Selection Parameters
 * @description Controls response shape through field inclusion/exclusion
 * @type {Array<Object>}
 * @constant
 *
 * @example
 * // Usage in Swagger documentation
 * parameters: [...fieldsFilter]
 *
 * @example
 * // API request example
 * GET /resources?fields=id,name,created_at
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
 * Detail Endpoint Parameters
 * @description Parameters for single resource retrieval endpoints
 * @type {Array<Object>}
 * @constant
 *
 * @example
 * // Usage in Swagger documentation
 * parameters: [...detailsParams]
 *
 * @example
 * // API request example
 * GET /resources/123?fields=id,name&includeHistory=true
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
 * Active Status Filter Parameter
 * @description Filters resources based on active/inactive status
 * @type {Array<Object>}
 * @constant
 *
 * @example
 * // Usage in Swagger documentation
 * parameters: [...activeParams]
 *
 * @example
 * // API request example
 * GET /resources?active=true
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
 * Active Status Body Schema
 * @description Schema definition for active status field in request bodies
 * @type {Object}
 * @constant
 *
 * @property {boolean} active - Activation status of the resource
 *
 * @example
 * // Usage in Swagger request body definition
 * requestBody: {
 *   content: {
 *     'application/json': {
 *       schema: {
 *         type: 'object',
 *         properties: {
 *           active: activeBody.active
 *         }
 *       }
 *     }
 *   }
 * }
 */
const activeBody = {
  active: {
    type: 'boolean',
    description:
      '**[Optional]** If set to `true`, the record will be marked as active; if set to `false`, the record will be marked as inactive using soft deletion. If not provided, the record will not be modified.',
    enum: [true, false],
    example: faker.datatype.boolean(),
    required: false,
  },
};

/**
 * Complete Collection Endpoint Parameters
 * @description Standard parameter set for list/search endpoints
 * @type {Array<Object>}
 * @constant
 *
 * @example
 * // Usage in Swagger documentation
 * parameters: [...commonListParams]
 *
 * @example
 * // API request example
 * GET /resources?limit=10&offset=20&ids=1,2,3&fields=id,name
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

  /**
   * Active status body schema definition
   * @type {Object}
   */
  activeBody,
};
