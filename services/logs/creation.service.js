// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../config/database/connection');
const { paginateModel } = require('../../helpers/database/pagination.helper');
const { setSearchQuery } = require('../../helpers/database/utilities.helper');

const { logsCreation } = sequelize.models;

class CreationServices {
  /**
   * Creates a creation log for a given record.
   * @param {Object} user - User responsible for creating the record.
   * @param {Object} model - Table model that the record belongs to.
   * @param {Object} createdData - Record data that was created.
   * @param {Object} [options] - Optional parameters.
   * @param {Object} [options.transaction] - Sequelize transaction object.
   * @returns {Promise<Object>} - Newly created log entry.
   */
  static async createLog(user, model, createdData, { transaction } = {}) {
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
}

module.exports = CreationServices;
