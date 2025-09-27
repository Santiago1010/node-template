// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const CreationServices = require('../logs/creation.service');
const sequelize = require('../../config/database/connection');
const { wrapLogging } = require('../../helpers/debug.helper');

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

  static async updateStatus(_ids, _active) {
    // TODO: Implement status update
  }
}

module.exports = AccountServices;
