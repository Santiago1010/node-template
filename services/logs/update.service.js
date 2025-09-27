// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../config/database/connection');
const { paginateModel, setSearchQuery } = require('../../helpers/database.helper');

const { logsUpdate } = sequelize.models;

class UpdateServices {
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
  static async createLog(user, model, oldData, newData, { transaction } = {}) {
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

  /**
   * Retrieves update logs for a specific table.
   * @param {string} tableName - Name of the table to filter by.
   * @param {Object} [options] - Optional parameters.
   * @param {number} [options.limit] - Items per page.
   * @param {number} [options.page] - Page number.
   * @returns {Promise<Object>} - Paginated list of update logs for the table.
   */
  static async getTableUpdateHistory(tableName, { limit, page } = {}) {
    const optionsQuery = {
      where: {
        'tableModel.tableName': tableName,
      },
      order: [['updatedAt', 'DESC']],
    };

    return await paginateModel(logsUpdate, limit, page, optionsQuery);
  }

  /**
   * Compares old and new data to identify changed fields.
   * @param {Object} oldData - Previous data of the record.
   * @param {Object} newData - New data of the record.
   * @returns {Object} - Object containing changed fields and their values.
   */
  static getChangedFields(oldData, newData) {
    const changes = {};

    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key],
        };
      }
    }

    return changes;
  }
}

module.exports = UpdateServices;
