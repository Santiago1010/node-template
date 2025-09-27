// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CreationServices = require('../logs/creation.service');
const StatusServices = require('../logs/status.service');
const sequelize = require('../../config/database/connection');
const { wrapLogging } = require('../../helpers/debug.helper');
const { bulkToggleSoftDelete } = require('../../helpers/database.helper');

// =============================================================================
// MODELS
// =============================================================================
const { usrAccounts } = sequelize.models;

class AccountServices {
  // ================================= CRUD ================================= //
  static async create(user) {
    const createData = {};

    return await sequelize.transaction(async (transaction) => {
      const account = await usrAccounts.create(createData, {
        transaction,
        logging: wrapLogging('[AccountServices.create] ', createData),
      });

      await CreationServices.createLog(user, usrAccounts, account, { transaction });

      return account;
    });
  }

  static async updateStatus(user, ids, active) {
    return await sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(usrAccounts, { id: { [Op.in]: ids } }, active, { transaction });

      const logsPromises = ids.map(async (id) => {
        return await StatusServices.createLog(user, usrAccounts, id, active, { transaction });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }
}

module.exports = AccountServices;
