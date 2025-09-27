// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../config/database/connection');

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
}

module.exports = CreationServices;
