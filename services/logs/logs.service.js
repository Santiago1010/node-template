// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../config/database/connection');
const { paginateModel, setSearchQuery } = require('../../helpers/database.helper');

const { logsCreation, logsDeletion, logsStatuses, logsUpdate } = sequelize.models;

class LogServices {
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
  static async recordCreationLog(user, model, createdData, { transaction } = {}) {
    return await logsCreation.create({ responsible: user, tableModel: model, createdData }, { transaction });
  }

  /**
   * Retrieves a paginated list of creation logs.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @param {string} [options.search] - Search query.
   * @returns {Promise<Object>} - Paginated list of creation logs.
   */
  static async listCreationLogs({ limit, page, search } = {}) {
    const optionsQuery = { where: {} };

    if (search) optionsQuery.where = setSearchQuery(logsCreation, search, optionsQuery);

    return await paginateModel(logsCreation, limit, page, optionsQuery);
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
  static async recordDeletionLog(user, model, deletedData, { justification, transaction } = {}) {
    return await logsDeletion.create(
      {
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
  static async listDeletionLogs({ limit, page, search } = {}) {
    const optionsQuery = {
      where: {},
      order: [['deletedAt', 'DESC']],
    };

    if (search) optionsQuery.where = setSearchQuery(logsDeletion, search, optionsQuery);

    return await paginateModel(logsDeletion, limit, page, optionsQuery);
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
  static async recordStatusChangeLog(user, model, rowId, type, { transaction } = {}) {
    return await logsStatuses.create(
      {
        responsible: user,
        tableModel: model,
        rowId,
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
  static async listStatusLogs({ limit, page, search, type } = {}) {
    const optionsQuery = { where: {} };

    if (search) optionsQuery.where = setSearchQuery(logsStatuses, search, optionsQuery);
    if (type) optionsQuery.where.type = type;

    return await paginateModel(logsStatuses, limit, page, optionsQuery);
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
  static async recordUpdateLog(user, model, oldData, newData, { transaction } = {}) {
    return await logsUpdate.create(
      {
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
  static async listUpdateLogs({ limit, page, search } = {}) {
    const optionsQuery = {
      where: {},
      order: [['updatedAt', 'DESC']],
    };

    if (search) optionsQuery.where = setSearchQuery(logsUpdate, search, optionsQuery);

    return await paginateModel(logsUpdate, limit, page, optionsQuery);
  }
}

module.exports = LogServices;
