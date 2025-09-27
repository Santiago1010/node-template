// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const sequelize = require('../../config/database/connection');

const { logsCreation } = sequelize.models;

class CreationServices {
  static async createLog(user, model, createdData, { transaction } = {}) {
    return await logsCreation.create({ responsible: user, tableModel: model, createdData }, { transaction });
  }
}

module.exports = CreationServices;
