// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../config/database/connection');
const { paginateModel, setSearchQuery } = require('../../helpers/database.helper');

const { logsDeletion } = sequelize.models;

class DeletionServices {
  /**
   * Creates a deletion log for a given record.
   * @param {Object} user - User responsible for deleting the record.
   * @param {Object} model - Table model that the record belongs to.
   * @param {Object} deletedData - Data of the record that was deleted.
   * @param {Object} [options] - Optional parameters.
   * @param {Object} [options.transaction] - Sequelize transaction object.
   * @returns {Promise<Object>} - Newly created log entry.
   */
  static async createLog(user, model, deletedData, { transaction } = {}) {
    return await logsDeletion.create(
      {
        responsible: user,
        tableModel: model,
        oldData: deletedData,
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

  /**
   * Retrieves deletion logs for a specific table.
   * @param {string} tableName - Name of the table to filter by.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @returns {Promise<Object>} - Paginated list of deletion logs for the table.
   */
  static async getTableDeletionHistory(tableName, { limit, page } = {}) {
    const optionsQuery = {
      where: {
        'tableModel.tableName': tableName,
      },
      order: [['deletedAt', 'DESC']],
    };

    return await paginateModel(logsDeletion, limit, page, optionsQuery);
  }

  /**
   * Retrieves deletion logs within a specific date range.
   * @param {Date} startDate - Start date for the range.
   * @param {Date} endDate - End date for the range.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @returns {Promise<Object>} - Paginated list of deletion logs within the date range.
   */
  static async getDeletionsByDateRange(startDate, endDate, { limit, page } = {}) {
    const optionsQuery = {
      where: {
        deletedAt: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate],
        },
      },
      order: [['deletedAt', 'DESC']],
    };

    return await paginateModel(logsDeletion, limit, page, optionsQuery);
  }

  /**
   * Restores deleted data information for reference (does not actually restore the record).
   * @param {number} logId - ID of the deletion log.
   * @returns {Promise<Object>} - Deletion log with the deleted data.
   */
  static async getDeletedRecordData(logId) {
    return await logsDeletion.findByPk(logId);
  }
}

module.exports = DeletionServices;
