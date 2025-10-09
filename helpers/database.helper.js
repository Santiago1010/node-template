// =============================================================================
// DATABASE HELPER
// =============================================================================
// This module provides a comprehensive suite of database utilities for
// Sequelize-based applications. It combines pagination, search, and other
// common database operations into a single, reusable helper.
//
// Key Features:
// - Standardized pagination with navigation metadata
// - Dynamic and advanced search capabilities
// - Soft delete and restore functionality
// - Type-safe parameter validation and sanitization
// - Consistent response formatting
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { DB_CONFIG } = require('../utils/constants.util');
const { cerror, wrapLogging } = require('./debug.helper');

// =============================================================================
// PAGINATION HELPER
// =============================================================================

/**
 * Validates and sanitizes pagination parameters.
 * @param {number|string} limit - Items per page.
 * @param {number|string} page - Current page number.
 * @returns {Object} Sanitized {limit, page} values.
 */
const validatePaginationParams = (limit, page) => {
  const parsedLimit = Math.max(
    DB_CONFIG.PAGINATION_CONFIG.MIN_LIMIT,
    Math.min(DB_CONFIG.PAGINATION_CONFIG.MAX_LIMIT, parseInt(limit) || DB_CONFIG.PAGINATION_CONFIG.DEFAULT_LIMIT)
  );
  const parsedPage = Math.max(
    DB_CONFIG.PAGINATION_CONFIG.MIN_PAGE,
    parseInt(page) || DB_CONFIG.PAGINATION_CONFIG.DEFAULT_PAGE
  );
  return { limit: parsedLimit, page: parsedPage };
};

/**
 * Paginates a Sequelize model with findAndCountAll.
 * @param {Model} Model - Sequelize model to paginate.
 * @param {number} limit - Items per page.
 * @param {number} page - Current page number.
 * @param {Object} queryOptions - Additional Sequelize query options.
 * @returns {Object} Paginated results with metadata.
 * @throws {Error} If pagination fails.
 */
const paginateModel = async (
  Model,
  limit = DB_CONFIG.PAGINATION_CONFIG.DEFAULT_LIMIT,
  page = DB_CONFIG.PAGINATION_CONFIG.DEFAULT_PAGE,
  queryOptions = {}
) => {
  try {
    const { limit: validLimit, page: validPage } = validatePaginationParams(limit, page);
    const offset = (validPage - 1) * validLimit;
    const query = { ...queryOptions, offset, limit: validLimit, distinct: true };
    const { rows: results, count } = await Model.findAndCountAll(query);
    const total = Array.isArray(count) ? count.length : count;
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
 * Builds a pagination URL for a specific page.
 * @param {Request} req - Express request object.
 * @param {number} page - Target page number.
 * @returns {string|null} Full URL string or null on failure.
 */
const buildPageUrl = (req, page) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl || req.path}`;
    const url = new URL(baseUrl);
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'page') {
        url.searchParams.set(key, value);
      }
    });
    url.searchParams.set('page', page.toString());
    return url.toString();
  } catch (error) {
    cerror('Build page URL', `Error building URL: ${error.message}`);
    return null;
  }
};

/**
 * Converts URLSearchParams to an object with proper typing.
 * @param {URLSearchParams} searchParams - URL search parameters.
 * @returns {Object} Object with typed values.
 */
const searchParamsToObject = (searchParams) => {
  const result = {};
  for (const [key, value] of searchParams.entries()) {
    const numValue = Number(value);
    result[key] = !isNaN(numValue) && isFinite(numValue) && value.trim() !== '' ? numValue : value;
  }
  return result;
};

/**
 * Generates complete navigation metadata for HTTP responses.
 * @param {Request} req - Express request object.
 * @param {Object} paginationData - Paginated model data.
 * @returns {Object} Complete navigation metadata.
 */
const generateNavigationMetadata = (req, { results, pagination }) => {
  const { currentPage, hasNextPage, hasPrevPage, total, totalPages, limit } = pagination;
  const prevUrl = hasPrevPage ? buildPageUrl(req, currentPage - 1) : null;
  const nextUrl = hasNextPage ? buildPageUrl(req, currentPage + 1) : null;
  const prevPage = prevUrl
    ? { url: prevUrl, page: currentPage - 1, queryObject: searchParamsToObject(new URL(prevUrl).searchParams) }
    : null;
  const nextPage = nextUrl
    ? { url: nextUrl, page: currentPage + 1, queryObject: searchParamsToObject(new URL(nextUrl).searchParams) }
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
 * Formats the pagination response with navigation metadata.
 * @param {Request} req - Express request object.
 * @param {Object} paginationData - Raw pagination data.
 * @returns {Object} Formatted pagination response.
 * @throws {Error} If metadata generation fails.
 */
const paginateResponse = (req, paginationData) => {
  try {
    return generateNavigationMetadata(req, paginationData);
  } catch (error) {
    throw new Error(`Navigation metadata generation error: ${error.message}`);
  }
};

/**
 * Main pagination helper function.
 * @param {Model} Model - Sequelize model to paginate.
 * @param {Request} req - Express request object.
 * @param {Object} queryOptions - Additional Sequelize query options.
 * @returns {Object} Fully formatted pagination response.
 */
const paginate = async (Model, req, queryOptions = {}) => {
  const { limit, page } = req.query;
  const modelData = await paginateModel(Model, limit, page, queryOptions);
  return paginateResponse(req, modelData);
};

// =============================================================================
// DATABASE UTILITIES
// =============================================================================

/**
 * Validates if a value is a valid Sequelize model instance.
 * @param {Object} model - Model instance to validate.
 * @returns {boolean} True if valid model.
 */
const isValidModel = (model) => {
  return model && typeof model.findAndCountAll === 'function';
};

/**
 * Validates and sanitizes search parameters.
 * @param {Object} searchParams - Search parameters to validate.
 * @returns {Object} Validated search parameters.
 */
const validateSearchParams = (searchParams = {}) => {
  const { query = '', fields = [], limit, operator = 'like' } = searchParams;
  return {
    query: String(query).trim(),
    fields: Array.isArray(fields) ? fields : [fields].filter(Boolean),
    limit: Math.max(
      DB_CONFIG.SEARCH.MIN_LIMIT,
      Math.min(DB_CONFIG.SEARCH.MAX_RESULTS, parseInt(limit) || DB_CONFIG.SEARCH.DEFAULT_LIMIT)
    ),
    operator: Object.values(DB_CONFIG.SEARCH.OPERATORS).includes(operator) ? operator : DB_CONFIG.SEARCH.OPERATORS.LIKE,
  };
};

/**
 * Maps search operators to Sequelize operators.
 * @param {string} operator - Search operator.
 * @param {any} value - Search value.
 * @returns {Object} Sequelize operator object.
 */
const mapSearchOperator = (operator, value) => {
  const operatorMap = {
    [DB_CONFIG.SEARCH.OPERATORS.LIKE]: { [Op.like]: `%${value}%` },
    [DB_CONFIG.SEARCH.OPERATORS.ILIKE]: { [Op.iLike]: `%${value}%` },
    [DB_CONFIG.SEARCH.OPERATORS.EXACT]: { [Op.eq]: value },
    [DB_CONFIG.SEARCH.OPERATORS.GT]: { [Op.gt]: value },
    [DB_CONFIG.SEARCH.OPERATORS.GTE]: { [Op.gte]: value },
    [DB_CONFIG.SEARCH.OPERATORS.LT]: { [Op.lt]: value },
    [DB_CONFIG.SEARCH.OPERATORS.LTE]: { [Op.lte]: value },
    [DB_CONFIG.SEARCH.OPERATORS.IN]: { [Op.in]: Array.isArray(value) ? value : [value] },
    [DB_CONFIG.SEARCH.OPERATORS.NOT_IN]: { [Op.notIn]: Array.isArray(value) ? value : [value] },
    [DB_CONFIG.SEARCH.OPERATORS.BETWEEN]: { [Op.between]: Array.isArray(value) ? value : [value, value] },
  };
  return operatorMap[operator] || operatorMap[DB_CONFIG.SEARCH.OPERATORS.LIKE];
};

/**
 * Builds search conditions for nested associations.
 * @param {Array} includes - Array of include objects.
 * @param {string} query - Search query.
 * @param {Array} searchFields - Fields to search in.
 * @param {string} operator - Search operator.
 * @returns {Array} Modified includes with search conditions.
 */
const buildNestedSearchConditions = (includes = [], query, searchFields = [], operator = 'like') => {
  if (!query || !Array.isArray(includes)) return includes;
  return includes.map((include) => {
    const modifiedInclude = { ...include };
    const associationFields = searchFields.filter((field) => field.startsWith(`${include.as || include.model.name}.`));
    if (associationFields.length > 0) {
      const whereConditions = associationFields.map((field) => {
        const fieldName = field.split('.').pop();
        return { [fieldName]: mapSearchOperator(operator, query) };
      });
      modifiedInclude.where = { ...modifiedInclude.where, [Op.or]: whereConditions };
      modifiedInclude.required = false;
    }
    if (modifiedInclude.include) {
      modifiedInclude.include = buildNestedSearchConditions(modifiedInclude.include, query, searchFields, operator);
    }
    return modifiedInclude;
  });
};

/**
 * Dynamic search function with support for nested associations.
 * @param {Object} Model - Sequelize model to search in.
 * @param {Object} searchParams - Search parameters.
 * @param {Object} queryOptions - Additional query options.
 * @returns {Promise<Object>} Search results with metadata.
 */
const search = async (Model, searchParams = {}, queryOptions = {}) => {
  try {
    if (!isValidModel(Model)) {
      throw new Error('Invalid Sequelize model provided');
    }
    const { query, fields, limit, operator } = validateSearchParams(searchParams);
    if (!query) {
      return { results: [], metadata: { total: 0, query: '', fields: [], operator, limit } };
    }
    const mainModelFields = fields.filter((field) => !field.includes('.'));
    const associationFields = fields.filter((field) => field.includes('.'));
    const mainSearchConditions =
      mainModelFields.length > 0
        ? mainModelFields.map((field) => ({ [field]: mapSearchOperator(operator, query) }))
        : [];
    const searchQuery = {
      ...queryOptions,
      limit,
      where: { ...queryOptions.where, ...(mainSearchConditions.length > 0 && { [Op.or]: mainSearchConditions }) },
    };
    if (queryOptions.include && associationFields.length > 0) {
      searchQuery.include = buildNestedSearchConditions(queryOptions.include, query, associationFields, operator);
    }
    const { rows: results, count } = await Model.findAndCountAll(searchQuery);
    return {
      results,
      metadata: {
        total: Array.isArray(count) ? count.length : count,
        query,
        fields,
        operator,
        limit,
        hasMore: (Array.isArray(count) ? count.length : count) >= limit,
      },
    };
  } catch (error) {
    throw new Error(`Search operation failed: ${error.message}`);
  }
};

/**
 * Extracts all searchable fields from a model and its nested includes.
 * @param {Object} Model - Sequelize model.
 * @param {Array} includes - Array of include objects.
 * @param {string} prefix - Prefix for nested field names.
 * @returns {Object} Object containing main model fields and association fields.
 */
const extractAllSearchableFields = (Model, includes = [], prefix = '') => {
  const fields = { mainModel: [], associations: [] };
  if (Model.rawAttributes) {
    const mainModelFields = Object.keys(Model.rawAttributes)
      .filter((attr) => {
        const attrType = Model.rawAttributes[attr].type;
        return ['STRING', 'TEXT', 'CHAR'].includes(attrType.constructor.name);
      })
      .map((field) => (prefix ? `${prefix}.${field}` : field));
    if (prefix) {
      fields.associations.push(...mainModelFields);
    } else {
      fields.mainModel.push(...mainModelFields);
    }
  }
  if (Array.isArray(includes)) {
    includes.forEach((include) => {
      const associationName = include.as || include.model.name;
      const nestedPrefix = prefix ? `${prefix}.${associationName}` : associationName;
      const nestedFields = extractAllSearchableFields(include.model, include.include, nestedPrefix);
      fields.associations.push(...nestedFields.mainModel, ...nestedFields.associations);
    });
  }
  return fields;
};

/**
 * Builds Elasticsearch-like search conditions.
 * @param {string} query - Search query.
 * @param {Object} searchableFields - Searchable fields object.
 * @returns {Object} Search conditions for the main model and associations.
 */
const buildElasticsearchLikeConditions = (query, searchableFields) => {
  const conditions = { mainModel: [], associations: searchableFields.associations };
  const tokens = query.split(/\s+/).filter(Boolean);
  searchableFields.mainModel.forEach((field) => {
    conditions.mainModel.push({ [field]: { [Op.iLike]: `%${query}%` } });
    tokens.forEach((token) => {
      if (token !== query) {
        conditions.mainModel.push({ [field]: { [Op.iLike]: `%${token}%` } });
      }
    });
    conditions.mainModel.push({ [field]: { [Op.iLike]: `${query}%` } });
  });
  return conditions;
};

/**
 * Applies search conditions to includes recursively.
 * @param {Array} includes - Array of include objects.
 * @param {string} query - Search query.
 * @param {Array} associationFields - Association fields to search.
 * @returns {Array} Modified includes with search conditions.
 */
const applySearchToIncludes = (includes, query, associationFields) => {
  if (!Array.isArray(includes)) return includes;
  const tokens = query.split(/\s+/).filter(Boolean);
  return includes.map((include) => {
    const modifiedInclude = { ...include };
    const associationName = include.as || include.model.name;
    const thisAssociationFields = associationFields.filter((field) => field.startsWith(`${associationName}.`));
    if (thisAssociationFields.length > 0) {
      const whereConditions = [];
      thisAssociationFields.forEach((fullFieldName) => {
        const fieldName = fullFieldName.replace(`${associationName}.`, '');
        if (fieldName.includes('.')) return;
        whereConditions.push({ [fieldName]: { [Op.iLike]: `%${query}%` } });
        tokens.forEach((token) => {
          if (token !== query) {
            whereConditions.push({ [fieldName]: { [Op.iLike]: `%${token}%` } });
          }
        });
        whereConditions.push({ [fieldName]: { [Op.iLike]: `${query}%` } });
      });
      if (whereConditions.length > 0) {
        modifiedInclude.where = { ...modifiedInclude.where, [Op.or]: whereConditions };
        modifiedInclude.required = false;
      }
    }
    if (modifiedInclude.include) {
      modifiedInclude.include = applySearchToIncludes(modifiedInclude.include, query, associationFields);
    }
    return modifiedInclude;
  });
};

/**
 * Calculates relevance scores for search results.
 * @param {Array} results - Search results.
 * @param {string} query - Search query.
 * @param {Object} searchableFields - Searchable fields.
 * @returns {Array} Results with relevance scores.
 */
const calculateRelevanceScores = (results, query, searchableFields) => {
  if (!Array.isArray(results)) return results;
  return results.map((result) => {
    let score = 0;
    const queryLower = query.toLowerCase();
    searchableFields.mainModel.forEach((field) => {
      const value = result.get(field);
      if (typeof value === 'string') {
        const valueLower = value.toLowerCase();
        if (valueLower === queryLower) score += 100;
        else if (valueLower.startsWith(queryLower)) score += 50;
        else if (valueLower.includes(queryLower)) score += 25;
      }
    });
    result.setDataValue('_relevanceScore', score);
    return result;
  });
};

/**
 * Advanced search function that simulates Elasticsearch-like filtering.
 * @param {Object} Model - Sequelize model to search in.
 * @param {string} searchString - Search query string.
 * @param {Object} optionsQuery - Query options.
 * @returns {Promise<Object>} Search results with enhanced metadata.
 */
const setSearchQuery = async (Model, searchString, optionsQuery = {}) => {
  try {
    if (!isValidModel(Model)) {
      throw new Error('Invalid Sequelize model provided');
    }
    if (!searchString || typeof searchString !== 'string' || !searchString.trim()) {
      const { rows: results, count } = await Model.findAndCountAll(optionsQuery);
      return {
        results,
        metadata: {
          total: Array.isArray(count) ? count.length : count,
          query: '',
          searchApplied: false,
          hasMore: false,
        },
      };
    }
    const query = searchString.trim();
    const baseOptions = { ...optionsQuery };
    const searchableFields = extractAllSearchableFields(Model, baseOptions.include);
    const searchConditions = buildElasticsearchLikeConditions(query, searchableFields);
    if (searchConditions.mainModel.length > 0) {
      baseOptions.where = { ...baseOptions.where, [Op.or]: searchConditions.mainModel };
    }
    if (baseOptions.include && searchConditions.associations.length > 0) {
      baseOptions.include = applySearchToIncludes(baseOptions.include, query, searchConditions.associations);
    }
    const { rows: results, count } = await Model.findAndCountAll({ ...baseOptions, distinct: true, subQuery: false });
    const resultsWithScore = calculateRelevanceScores(results, query, searchableFields);
    return {
      results: resultsWithScore,
      metadata: {
        total: Array.isArray(count) ? count.length : count,
        query,
        searchApplied: true,
        searchableFields,
        hasMore: false,
        relevanceScored: true,
      },
    };
  } catch (error) {
    throw new Error(`Advanced search operation failed: ${error.message}`);
  }
};

// =============================================================================
// SOFT DELETE UTILITIES
// =============================================================================

/**
 * Toggles the soft delete state of a record.
 * @param {Object} modelInstance - Sequelize model instance.
 * @param {boolean} active - True to restore, false to delete.
 * @param {Object} options - Transaction and force options.
 * @returns {Promise<Object>} Operation result.
 */
const toggleSoftDelete = async (modelInstance, active, options = {}) => {
  try {
    if (!modelInstance) {
      throw new Error('Model instance is required');
    }
    const { force = false, transaction } = options;
    if (active === true) {
      if (typeof modelInstance.restore === 'function') {
        await modelInstance.restore({ transaction });
        return { action: 'restored', instance: modelInstance };
      }
      throw new Error('Model does not support soft delete restoration');
    }
    await modelInstance.destroy({ force, transaction });
    return { action: force ? 'permanently_deleted' : 'soft_deleted', instance: modelInstance };
  } catch (error) {
    throw new Error(`Toggle soft delete failed: ${error.message}`);
  }
};

/**
 * Bulk toggles the soft delete state for multiple records.
 * @param {Object} Model - Sequelize model.
 * @param {Object} where - Where conditions.
 * @param {boolean} active - True to restore, false to delete.
 * @param {Object} options - Transaction and force options.
 * @returns {Promise<Object>} Operation result.
 */
const bulkToggleSoftDelete = async (Model, where, active, options = {}) => {
  try {
    if (!isValidModel(Model)) {
      throw new Error('Invalid Sequelize model provided');
    }
    const { force = false, transaction } = options;
    if (active === true) {
      const restoredCount = await Model.restore({ where, transaction, logging: wrapLogging('Restore records') });
      return { action: 'restored', count: restoredCount };
    }
    const deletedCount = await Model.destroy({ where, force, transaction, logging: wrapLogging('Delete records') });
    return { action: force ? 'permanently_deleted' : 'soft_deleted', count: deletedCount };
  } catch (error) {
    throw new Error(`Bulk toggle soft delete failed: ${error.message}`);
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Pagination
  paginate,
  paginateModel,
  paginateResponse,

  // Search
  search,
  setSearchQuery,
  mapSearchOperator,
  buildNestedSearchConditions,

  // Soft Deletes
  toggleSoftDelete,
  bulkToggleSoftDelete,

  // Validation
  isValidModel,
  validateSearchParams,
};
