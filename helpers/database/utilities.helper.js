// =============================================================================
// DATABASE UTILITIES HELPER
// =============================================================================
// Generic and reusable database utilities for Sequelize ORM
// Provides common operations like CRUD, search, pagination, and soft deletes
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { DB_CONFIG } = require('../constants.helper');
const { wrapLogging } = require('../debug.helper');

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validates if a value is a valid Sequelize model instance
 * @param {Object} model - Model instance to validate
 * @returns {boolean} True if valid model
 */
const isValidModel = (model) => {
  return model && typeof model.findAndCountAll === 'function';
};

/**
 * Validates and sanitizes search parameters
 * @param {Object} searchParams - Search parameters to validate
 * @returns {Object} Validated search parameters
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

// =============================================================================
// SEARCH UTILITIES
// =============================================================================

/**
 * Maps search operators to Sequelize operators
 * @param {string} operator - Search operator
 * @param {any} value - Search value
 * @returns {Object} Sequelize operator object
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
 * Builds search conditions for nested associations
 * @param {Array} includes - Array of include objects
 * @param {string} query - Search query
 * @param {Array} searchFields - Fields to search in
 * @param {string} operator - Search operator
 * @returns {Array} Modified includes with search conditions
 */
const buildNestedSearchConditions = (includes = [], query, searchFields = [], operator = 'like') => {
  if (!query || !Array.isArray(includes)) return includes;

  return includes.map((include) => {
    const modifiedInclude = { ...include };

    // Find searchable fields in this association
    const associationFields = searchFields.filter((field) => field.startsWith(`${include.as || include.model.name}.`));

    if (associationFields.length > 0) {
      // Build where conditions for this association
      const whereConditions = associationFields.map((field) => {
        const fieldName = field.split('.').pop();
        return { [fieldName]: mapSearchOperator(operator, query) };
      });

      modifiedInclude.where = {
        ...modifiedInclude.where,
        [Op.or]: whereConditions,
      };
      modifiedInclude.required = false; // LEFT JOIN to avoid filtering out parent records
    }

    // Recursively handle nested includes
    if (modifiedInclude.include) {
      modifiedInclude.include = buildNestedSearchConditions(modifiedInclude.include, query, searchFields, operator);
    }

    return modifiedInclude;
  });
};

/**
 * Dynamic search function with support for nested associations
 * @param {Object} Model - Sequelize model to search in
 * @param {Object} searchParams - Search parameters
 * @param {Object} queryOptions - Additional query options
 * @returns {Promise<Object>} Search results with metadata
 */
const search = async (Model, searchParams = {}, queryOptions = {}) => {
  try {
    if (!isValidModel(Model)) {
      throw new Error('Invalid Sequelize model provided');
    }

    const { query, fields, limit, operator } = validateSearchParams(searchParams);

    // If no query provided, return empty results
    if (!query) {
      return {
        results: [],
        metadata: {
          total: 0,
          query: '',
          fields: [],
          operator,
          limit,
        },
      };
    }

    // Separate main model fields from association fields
    const mainModelFields = fields.filter((field) => !field.includes('.'));
    const associationFields = fields.filter((field) => field.includes('.'));

    // Build main model search conditions
    const mainSearchConditions =
      mainModelFields.length > 0
        ? mainModelFields.map((field) => ({
            [field]: mapSearchOperator(operator, query),
          }))
        : [];

    // Build the base query
    const searchQuery = {
      ...queryOptions,
      limit,
      where: {
        ...queryOptions.where,
        ...(mainSearchConditions.length > 0 && {
          [Op.or]: mainSearchConditions,
        }),
      },
    };

    // Handle nested associations search
    if (queryOptions.include && associationFields.length > 0) {
      searchQuery.include = buildNestedSearchConditions(queryOptions.include, query, associationFields, operator);
    }

    // Execute search
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
 * Advanced search function that simulates Elasticsearch-like filtering
 * with support for nested associations at all levels
 * @param {Object} Model - Sequelize model to search in
 * @param {string} searchString - Search query string
 * @param {Object} optionsQuery - Query options including includes, where, etc.
 * @returns {Promise<Object>} Search results with enhanced metadata
 */
const setSearchQuery = async (Model, searchString, optionsQuery = {}) => {
  try {
    if (!isValidModel(Model)) {
      throw new Error('Invalid Sequelize model provided');
    }

    // If no search string, return all results with applied filters
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

    // Extract all searchable fields from the model and its includes
    const searchableFields = extractAllSearchableFields(Model, baseOptions.include);

    // Build comprehensive search conditions
    const searchConditions = buildElasticsearchLikeConditions(query, searchableFields);

    // Apply search to main model
    if (searchConditions.mainModel.length > 0) {
      baseOptions.where = {
        ...baseOptions.where,
        [Op.or]: searchConditions.mainModel,
      };
    }

    // Apply search to includes recursively
    if (baseOptions.include && searchConditions.associations.length > 0) {
      baseOptions.include = applySearchToIncludes(baseOptions.include, query, searchConditions.associations);
    }

    // Execute the search with enhanced options
    const { rows: results, count } = await Model.findAndCountAll({
      ...baseOptions,
      distinct: true, // Avoid duplicates from joins
      subQuery: false, // Better performance for complex queries
    });

    // Calculate relevance scores for results
    const resultsWithScore = calculateRelevanceScores(results, query, searchableFields);

    return {
      results: resultsWithScore,
      metadata: {
        total: Array.isArray(count) ? count.length : count,
        query,
        searchApplied: true,
        searchFields: searchableFields,
        hasMore: false,
        relevanceScored: true,
      },
    };
  } catch (error) {
    throw new Error(`Advanced search operation failed: ${error.message}`);
  }
};

/**
 * Extracts all searchable fields from model and its nested includes
 * @param {Object} Model - Sequelize model
 * @param {Array} includes - Array of include objects
 * @param {string} prefix - Prefix for nested field names
 * @returns {Object} Object containing main model fields and association fields
 */
const extractAllSearchableFields = (Model, includes = [], prefix = '') => {
  const fields = {
    mainModel: [],
    associations: [],
  };

  // Get main model attributes (string and text fields only)
  if (Model.rawAttributes) {
    const mainModelFields = Object.keys(Model.rawAttributes)
      .filter((attr) => {
        const attrType = Model.rawAttributes[attr].type;
        return (
          attrType.constructor.name === 'STRING' ||
          attrType.constructor.name === 'TEXT' ||
          attrType.constructor.name === 'CHAR'
        );
      })
      .map((field) => (prefix ? `${prefix}.${field}` : field));

    if (prefix) {
      fields.associations.push(...mainModelFields);
    } else {
      fields.mainModel.push(...mainModelFields);
    }
  }

  // Recursively extract from includes
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
 * Builds Elasticsearch-like search conditions with multiple search strategies
 * @param {string} query - Search query
 * @param {Object} searchableFields - Searchable fields object
 * @returns {Object} Search conditions for main model and associations
 */
const buildElasticsearchLikeConditions = (query, searchableFields) => {
  const conditions = {
    mainModel: [],
    associations: searchableFields.associations,
  };

  // Tokenize query for multi-word searches
  const tokens = query.split(/\s+/).filter((token) => token.length > 0);

  // Build conditions for main model fields
  searchableFields.mainModel.forEach((field) => {
    // Exact phrase match (highest priority)
    conditions.mainModel.push({
      [field]: { [Op.iLike]: `%${query}%` },
    });

    // Individual token matches (medium priority)
    tokens.forEach((token) => {
      if (token !== query) {
        // Avoid duplicates
        conditions.mainModel.push({
          [field]: { [Op.iLike]: `%${token}%` },
        });
      }
    });

    // Starts with match (high priority for autocomplete-like behavior)
    conditions.mainModel.push({
      [field]: { [Op.iLike]: `${query}%` },
    });
  });

  return conditions;
};

/**
 * Applies search conditions to includes recursively
 * @param {Array} includes - Array of include objects
 * @param {string} query - Search query
 * @param {Array} associationFields - Association fields to search
 * @returns {Array} Modified includes with search conditions
 */
const applySearchToIncludes = (includes, query, associationFields) => {
  if (!Array.isArray(includes)) return includes;

  const tokens = query.split(/\s+/).filter((token) => token.length > 0);

  return includes.map((include) => {
    const modifiedInclude = { ...include };
    const associationName = include.as || include.model.name;

    // Find fields that belong to this association
    const thisAssociationFields = associationFields.filter((field) => field.startsWith(`${associationName}.`));

    if (thisAssociationFields.length > 0) {
      const whereConditions = [];

      thisAssociationFields.forEach((fullFieldName) => {
        const fieldName = fullFieldName.replace(`${associationName}.`, '');

        // Skip if this is a nested association field
        if (fieldName.includes('.')) return;

        // Exact phrase match
        whereConditions.push({
          [fieldName]: { [Op.iLike]: `%${query}%` },
        });

        // Individual token matches
        tokens.forEach((token) => {
          if (token !== query) {
            whereConditions.push({
              [fieldName]: { [Op.iLike]: `%${token}%` },
            });
          }
        });

        // Starts with match
        whereConditions.push({
          [fieldName]: { [Op.iLike]: `${query}%` },
        });
      });

      if (whereConditions.length > 0) {
        modifiedInclude.where = {
          ...modifiedInclude.where,
          [Op.or]: whereConditions,
        };
        modifiedInclude.required = false; // LEFT JOIN
      }
    }

    // Recursively handle nested includes
    if (modifiedInclude.include) {
      modifiedInclude.include = applySearchToIncludes(modifiedInclude.include, query, associationFields);
    }

    return modifiedInclude;
  });
};

/**
 * Calculates relevance scores for search results (basic implementation)
 * @param {Array} results - Search results
 * @param {string} query - Search query
 * @param {Object} searchableFields - Searchable fields
 * @returns {Array} Results with relevance scores
 */
const calculateRelevanceScores = (results, query, searchableFields) => {
  if (!Array.isArray(results)) return results;

  return results.map((result) => {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Score based on exact matches in main model fields
    searchableFields.mainModel.forEach((field) => {
      const value = result.get(field);
      if (value && typeof value === 'string') {
        const valueLower = value.toLowerCase();

        // Exact match gets highest score
        if (valueLower === queryLower) score += 100;
        // Starts with query gets high score
        else if (valueLower.startsWith(queryLower)) score += 50;
        // Contains query gets medium score
        else if (valueLower.includes(queryLower)) score += 25;
      }
    });

    // Add score as a virtual field (non-persistent)
    result.setDataValue('_relevanceScore', score);
    return result;
  });
};

// =============================================================================
// SOFT DELETE UTILITIES
// =============================================================================

/**
 * Toggle soft delete state of a record
 * @param {Object} modelInstance - Sequelize model instance
 * @param {boolean} active - True to restore, false to delete
 * @param {Object} options - Transaction and force options
 * @returns {Promise<Object>} Operation result
 */
const toggleSoftDelete = async (modelInstance, active, options = {}) => {
  try {
    if (!modelInstance) {
      throw new Error('Model instance is required');
    }

    const { force = false, transaction } = options;

    if (active === true) {
      // Restore the record
      if (typeof modelInstance.restore === 'function') {
        await modelInstance.restore({ transaction });
        return { action: 'restored', instance: modelInstance };
      } else {
        throw new Error('Model does not support soft delete restoration');
      }
    }

    // Delete the record
    await modelInstance.destroy({ force, transaction });
    return {
      action: force ? 'permanently_deleted' : 'soft_deleted',
      instance: modelInstance,
    };
  } catch (error) {
    throw new Error(`Toggle soft delete failed: ${error.message}`);
  }
};

/**
 * Bulk toggle soft delete for multiple records
 * @param {Object} Model - Sequelize model
 * @param {Object} where - Where conditions
 * @param {boolean} active - True to restore, false to delete
 * @param {Object} options - Transaction and force options
 * @returns {Promise<Object>} Operation result
 */
const bulkToggleSoftDelete = async (Model, where, active, options = {}) => {
  try {
    if (!isValidModel(Model)) {
      throw new Error('Invalid Sequelize model provided');
    }

    const { force = false, transaction } = options;

    if (active === true) {
      // Restore records
      const restoredCount = await Model.restore({ where, transaction, logging: wrapLogging('Restore records') });
      return { action: 'restored', count: restoredCount };
    }

    // Delete records
    const deletedCount = await Model.destroy({ where, force, transaction, logging: wrapLogging('Delete records') });
    return {
      action: force ? 'permanently_deleted' : 'soft_deleted',
      count: deletedCount,
    };
  } catch (error) {
    throw new Error(`Bulk toggle soft delete failed: ${error.message}`);
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
  // Search utilities
  search,
  setSearchQuery,
  mapSearchOperator,
  buildNestedSearchConditions,

  // Soft delete utilities
  toggleSoftDelete,
  bulkToggleSoftDelete,

  // Validation utilities
  isValidModel,
  validateSearchParams,
};
