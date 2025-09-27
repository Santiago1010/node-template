// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../config/database/connection');
const { paginateModel, setSearchQuery } = require('../../helpers/database.helper');

const { logsStatuses } = sequelize.models;

class StatusServices {
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
  static async createLog(user, model, rowId, type, { transaction } = {}) {
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

  /**
   * Retrieves status logs for a specific record.
   * @param {string} tableName - Name of the table.
   * @param {number} rowId - ID of the record.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @returns {Promise<Object>} - Paginated list of status logs for the record.
   */
  static async getRecordStatusHistory(tableName, rowId, { limit, page } = {}) {
    const optionsQuery = {
      where: {
        rowId,
        'tableModel.tableName': tableName,
      },
      order: [['updatedAt', 'DESC']],
    };

    return await paginateModel(logsStatuses, limit, page, optionsQuery);
  }
}

module.exports = StatusServices;
