// =============================================================================
// PAGINATION HELPER - Database pagination helper
// =============================================================================
// TODO: Add comprehensive documentation for this file
//
// =============================================================================

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { PAGINATION_CONFIG } = require('../constants.helper');
const { cerror } = require('../debug.helper');

/**
 * Validates and sanitizes pagination parameters
 * @param {number|string} limit - Items per page
 * @param {number|string} page - Current page number
 * @returns {Object} Sanitized {limit, page} values
 */
const validatePaginationParams = (limit, page) => {
  // Convert and validate limit
  const parsedLimit = Math.max(
    PAGINATION_CONFIG.MIN_LIMIT,
    Math.min(PAGINATION_CONFIG.MAX_LIMIT, parseInt(limit) || PAGINATION_CONFIG.DEFAULT_LIMIT)
  );

  // Convert and validate page
  const parsedPage = Math.max(PAGINATION_CONFIG.MIN_PAGE, parseInt(page) || PAGINATION_CONFIG.DEFAULT_PAGE);

  return { limit: parsedLimit, page: parsedPage };
};

/**
 * Paginates a Sequelize model with findAndCountAll
 * @param {Model} Model - Sequelize model to paginate
 * @param {number} limit - Items per page
 * @param {number} page - Current page number
 * @param {Object} queryOptions - Additional Sequelize query options
 * @returns {Object} Paginated results with metadata
 * @throws {Error} If pagination fails
 */
const paginateModel = async (
  Model,
  limit = PAGINATION_CONFIG.DEFAULT_LIMIT,
  page = PAGINATION_CONFIG.DEFAULT_PAGE,
  queryOptions = {}
) => {
  try {
    // Validate parameters
    const { limit: validLimit, page: validPage } = validatePaginationParams(limit, page);

    // Calculate offset
    const offset = (validPage - 1) * validLimit;

    // Build query with safe values
    const query = {
      ...queryOptions,
      offset,
      limit: validLimit,
      distinct: true,
    };

    // Execute query
    const { rows: results, count } = await Model.findAndCountAll(query);

    // Safely calculate total count
    const total = Array.isArray(count) ? count.length : count;

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validLimit);
    const hasNextPage = validPage < totalPages;
    const hasPrevPage = validPage > 1;

    return {
      results,
      pagination: {
        currentPage: validPage,
        limit: validLimit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  } catch (error) {
    throw new Error(`Pagination error: ${error.message}`);
  }
};

/**
 * Builds a pagination URL for a specific page
 * @param {Request} req - Express request object
 * @param {number} page - Target page number
 * @returns {string|null} Full URL string or null on failure
 */
const buildPageUrl = (req, page) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl || req.path}`;
    const url = new URL(baseUrl);

    // Copy existing query parameters
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'page') {
        url.searchParams.set(key, value);
      }
    });

    // Set new page parameter
    url.searchParams.set('page', page.toString());

    return url.toString();
  } catch (error) {
    cerror('Build page URL', `Error building URL: ${error.message}`);
    return null;
  }
};

/**
 * Converts URLSearchParams to object with proper typing
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Object with typed values
 */
const searchParamsToObject = (searchParams) => {
  const result = {};

  for (const [key, value] of searchParams.entries()) {
    // Attempt numeric conversion if valid
    const numValue = Number(value);
    result[key] = !isNaN(numValue) && isFinite(numValue) && value.trim() !== '' ? numValue : value;
  }

  return result;
};

/**
 * Generates complete navigation metadata for HTTP responses
 * @param {Request} req - Express request object
 * @param {Object} paginationData - Paginated model data
 * @returns {Object} Complete navigation metadata
 */
const generateNavigationMetadata = (req, { results, pagination }) => {
  const { currentPage, hasNextPage, hasPrevPage, total, totalPages, limit } = pagination;

  // Navigation URLs
  const prevUrl = hasPrevPage ? buildPageUrl(req, currentPage - 1) : null;
  const nextUrl = hasNextPage ? buildPageUrl(req, currentPage + 1) : null;

  // Complete page metadata objects
  const prevPage = prevUrl
    ? {
        url: prevUrl,
        page: currentPage - 1,
        queryObject: searchParamsToObject(new URL(prevUrl).searchParams),
      }
    : null;

  const nextPage = nextUrl
    ? {
        url: nextUrl,
        page: currentPage + 1,
        queryObject: searchParamsToObject(new URL(nextUrl).searchParams),
      }
    : null;

  return {
    results,
    pagination: {
      currentPage,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      prevPage,
      nextPage,
    },
  };
};

/**
 * Formats pagination response with navigation metadata
 * @param {Request} req - Express request object
 * @param {Object} paginationData - Raw pagination data
 * @returns {Object} Formatted pagination response
 * @throws {Error} If metadata generation fails
 */
const paginateResponse = (req, paginationData) => {
  try {
    return generateNavigationMetadata(req, paginationData);
  } catch (error) {
    throw new Error(`Navigation metadata generation error: ${error.message}`);
  }
};

/**
 * Main pagination helper function
 * @param {Model} Model - Sequelize model to paginate
 * @param {Request} req - Express request object
 * @param {Object} queryOptions - Additional Sequelize query options
 * @returns {Object} Fully formatted pagination response
 */
const paginate = async (Model, req, queryOptions = {}) => {
  const { limit, page } = req.query;
  const modelData = await paginateModel(Model, limit, page, queryOptions);
  return paginateResponse(req, modelData);
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  paginateModel,
  paginateResponse,
  paginate,
};
