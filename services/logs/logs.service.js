// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { getSequelize } = require('../../config/database/connection');
const { paginateModel, setSearchQuery } = require('../../helpers/database.helper');

class LogServices {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    return this;
  }

  // =============================== CREATION =============================== //
  /**
   * Creates a creation log for a given record.
   * @param {Object} user - User responsible for creating the record.
   * @param {Object} model - Table model that the record belongs to.
   * @param {Object} createdData - Record data that was created.
   * @param {Object} [options] - Optional parameters.
   * @param {Object} [options.transaction] - Sequelize transaction object.
   * @returns {Promise<Object>} - Newly created log entry.
   */

  async recordCreationLog(user, model, createdData, { transaction } = {}) {
    return await this.models.logsCreation.create(
      { rowId: this.getPrimaryKeyValue(createdData), responsible: user, tableModel: model, createdData },
      { transaction }
    );
  }

  /**
   * Retrieves a paginated list of creation logs.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @param {string} [options.search] - Search query.
   * @returns {Promise<Object>} - Paginated list of creation logs.
   */

  async listCreationLogs({ limit, page, search } = {}) {
    const optionsQuery = { where: {} };

    if (search) optionsQuery.where = setSearchQuery(this.models.logsCreation, search, optionsQuery);

    return await paginateModel(this.models.logsCreation, limit, page, optionsQuery);
  }

  // =============================== DELETION =============================== //
  /**
   * Creates a deletion log for a given record.
   * @param {Object} user - User responsible for deleting the record.
   * @param {Object} model - Table model that the record belongs to.
   * @param {Object} deletedData - Data of the record that was deleted.
   * @param {Object} [options] - Optional parameters.
   * @param {Object} [options.transaction] - Sequelize transaction object.
   * @returns {Promise<Object>} - Newly created log entry.
   */

  async recordDeletionLog(user, model, deletedData, { justification, transaction } = {}) {
    return await this.models.logsDeletion.create(
      {
        rowId: this.getPrimaryKeyValue(deletedData),
        responsible: user,
        tableModel: model,
        oldData: deletedData,
        justification,
      },
      { transaction }
    );
  }

  /**
   * Retrieves a paginated list of deletion logs.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @param {string} [options.search] - Search query.
   * @returns {Promise<Object>} - Paginated list of deletion logs.
   */

  async listDeletionLogs({ limit, page, search } = {}) {
    const optionsQuery = {
      where: {},
      order: [['deletedAt', 'DESC']],
    };

    if (search) optionsQuery.where = setSearchQuery(this.models.logsDeletion, search, optionsQuery);

    return await paginateModel(this.models.logsDeletion, limit, page, optionsQuery);
  }

  // ================================ STATUS ================================ //
  /**
   * Creates a status change log for a given record.
   * @param {Object} user - User responsible for changing the status.
   * @param {Object} model - Table model that the record belongs to.
   * @param {number} rowId - ID of the affected record.
   * @param {string} type - Type of operation ('reactivation' or 'deactivation').
   * @param {Object} [options] - Optional parameters.
   * @param {Object} [options.transaction] - Sequelize transaction object.
   * @returns {Promise<Object>} - Newly created log entry.
   */

  async recordStatusChangeLog(user, model, rowId, type, { transaction } = {}) {
    return await this.models.logsStatuses.create(
      {
        rowId,
        responsible: user,
        tableModel: model,
        type: type ? 'reactivation' : 'deactivation',
      },
      { transaction }
    );
  }

  /**
   * Retrieves a paginated list of status change logs.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @param {string} [options.search] - Search query.
   * @param {string} [options.type] - Filter by type ('reactivation' or 'deactivation').
   * @returns {Promise<Object>} - Paginated list of status logs.
   */

  async listStatusLogs({ limit, page, search, type } = {}) {
    const optionsQuery = { where: {} };

    if (search) optionsQuery.where = setSearchQuery(this.models.logsStatuses, search, optionsQuery);
    if (type) optionsQuery.where.type = type;

    return await paginateModel(this.models.logsStatuses, limit, page, optionsQuery);
  }

  // ================================ UPDATE ================================ //
  /**
   * Creates an update log for a given record.
   * @param {Object} user - User responsible for updating the record.
   * @param {Object} model - Table model that the record belongs to.
   * @param {Object} oldData - Previous data of the record before update.
   * @param {Object} newData - New data of the record after update.
   * @param {Object} [options] - Optional parameters.
   * @param {Object} [options.transaction] - Sequelize transaction object.
   * @returns {Promise<Object>} - Newly created log entry.
   */

  async recordUpdateLog(user, model, oldData, newData, { transaction } = {}) {
    return await this.models.logsUpdate.create(
      {
        rowId: this.getPrimaryKeyValue(newData),
        responsible: user,
        tableModel: model,
        oldData,
        newData,
      },
      { transaction }
    );
  }

  /**
   * Retrieves a paginated list of update logs.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @param {string} [options.search] - Search query.
   * @returns {Promise<Object>} - Paginated list of update logs.
   */

  async listUpdateLogs({ limit, page, search } = {}) {
    const optionsQuery = {
      where: {},
      order: [['updatedAt', 'DESC']],
    };

    if (search) optionsQuery.where = setSearchQuery(this.models.logsUpdate, search, optionsQuery);

    return await paginateModel(this.models.logsUpdate, limit, page, optionsQuery);
  }

  // =============================== HELPERS =============================== //
  /**
   * Returns the primary key value of a Sequelize model instance.
   * If the model has a single primary key, it returns the value of that key.
   * If the model has a composite primary key, it returns an object with the key names as properties and the corresponding values.
   * @param {Object} instance - Sequelize model instance.
   * @returns {Object|number|string|boolean} Primary key value.
   */

  getPrimaryKeyValue(instance) {
    const Model = instance.constructor;
    const primaryKeys = Model.primaryKeyAttributes;

    if (primaryKeys.length === 1) {
      const primaryKeyName = primaryKeys[0];
      return instance[primaryKeyName];
    }

    const compositeKey = {};
    for (const key of primaryKeys) {
      compositeKey[key] = instance[key];
    }

    return compositeKey;
  }

  /**
   * Returns the full history of logs related to a specific Sequelize instance.
   *
   * - Accepts an instance (returned from Model.findOne / findByPk / etc.).
   * - Optionally filters by types (creation, deletion, update, status).
   * - Combines results from the four log tables into a single array,
   *   normalizes each entry with `logType` and `logDate`, sorts by date
   *   (newest-to-oldest by default) and applies pagination after merging.
   *
   * NOTE: This method expects a single-column primary key. If your models
   * use composite primary keys, this method will throw an error.
   *
   * @param {Object} instance - Sequelize model instance (e.g. await Model.findOne(...)).
   * @param {Object} [options]
   * @param {number|null} [options.limit=null] - Number of items per page (applied AFTER merging + sorting).
   * @param {number} [options.page=1] - Page number (applied only when `limit` is provided).
   * @param {Array<string>} [options.types=['creation','deletion','update','status']] - Which log types to include.
   * @param {string} [options.order='DESC'] - 'DESC' (newest first) or 'ASC' (oldest first).
   * @returns {Promise<Array<Object>>} - Array of plain objects (logs) ordered by date.
   */

  async getFullLogsHistory(
    instance,
    { limit = null, page = 1, types = ['creation', 'deletion', 'update', 'status'], order = 'DESC' } = {}
  ) {
    if (!instance) throw new Error('An instance is required to fetch its logs.');

    const Model = instance.constructor;
    const primaryKeys = Model.primaryKeyAttributes || [];

    if (primaryKeys.length !== 1) {
      throw new Error('getFullLogsHistory does not support composite primary keys.');
    }

    const primaryKeyName = primaryKeys[0];
    const id = instance[primaryKeyName];

    if (typeof id === 'undefined' || id === null) {
      throw new Error('Unable to determine primary key value from the provided instance.');
    }

    // Model identity (used to ensure logs belong to the same model)
    const modelName = Model.name;
    const tableName = typeof Model.getTableName === 'function' ? Model.getTableName() : null;

    // Available log models (assumes these exist in the same sequelize instance scope)
    const { logsCreation, logsDeletion, logsStatuses, logsUpdate } = this.models.models;

    const wanted = new Set((types || []).map((t) => String(t).toLowerCase()));

    const queries = [];
    if (wanted.has('creation') && logsCreation) queries.push(logsCreation.findAll({ where: { rowId: id } }));
    if (wanted.has('deletion') && logsDeletion) queries.push(logsDeletion.findAll({ where: { rowId: id } }));
    if (wanted.has('update') && logsUpdate) queries.push(logsUpdate.findAll({ where: { rowId: id } }));
    if (wanted.has('status') && logsStatuses) queries.push(logsStatuses.findAll({ where: { rowId: id } }));

    // Run queries in parallel
    const results = await Promise.all(queries);

    // Flatten and convert to plain objects
    const flat = results.reduce((acc, arr) => acc.concat(arr.map((r) => r.get({ plain: true }))), []);

    // Filter by model identity (the logs store tableModel as JSON with { tableName, modelName })
    const filtered = flat.filter((log) => {
      if (!log.tableModel) return false;
      const lm = log.tableModel;
      return lm.modelName === modelName || (tableName && lm.tableName === tableName);
    });

    // Normalize each record to guarantee a single sortable date field and a logType
    const normalized = filtered.map((log) => {
      let logType = 'unknown';
      let logDate = null;

      // Identify type and date by presence of known attributes
      if (Object.prototype.hasOwnProperty.call(log, 'createdAt') && Object.prototype.hasOwnProperty.call(log, 'data')) {
        logType = 'creation';
        logDate = log.createdAt;
      } else if (Object.prototype.hasOwnProperty.call(log, 'deletedAt')) {
        logType = 'deletion';
        logDate = log.deletedAt;
      } else if (
        Object.prototype.hasOwnProperty.call(log, 'oldData') &&
        Object.prototype.hasOwnProperty.call(log, 'newData')
      ) {
        logType = 'update';
        logDate = log.updatedAt || log.createdAt || null;
      } else if (Object.prototype.hasOwnProperty.call(log, 'type')) {
        logType = 'status';
        // logsStatuses uses updatedAt to store the time of the change
        logDate = log.updatedAt || log.createdAt || null;
      } else {
        // fallback to any known timestamp fields
        logDate = log.updatedAt || log.createdAt || log.deletedAt || null;
      }

      return Object.assign({}, log, { logType, logDate });
    });

    // Sort by logDate
    normalized.sort((a, b) => {
      const ta = a.logDate ? new Date(a.logDate).getTime() : 0;
      const tb = b.logDate ? new Date(b.logDate).getTime() : 0;

      return String(order).toUpperCase() === 'ASC' ? ta - tb : tb - ta;
    });

    // If pagination requested, apply it AFTER sorting (so pages reflect the merged timeline)
    if (limit && Number(limit) > 0) {
      const start = (Number(page) - 1) * Number(limit);
      return normalized.slice(start, start + Number(limit));
    }

    return normalized;
  }
}

module.exports = LogServices;
