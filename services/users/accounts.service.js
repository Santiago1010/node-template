// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LogServices = require('../logs/logs.service');
const sequelize = require('../../config/database/connection');
const { bulkToggleSoftDelete, paginateModel, setSearchQuery } = require('../../helpers/database.helper');
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

      await LogServices.recordCreationLog(user, usrAccounts, account, { transaction });

      return account;
    });
  }

  static async updateStatus(user, ids, active) {
    return await sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(usrAccounts, { id: { [Op.in]: ids } }, active, {
        transaction,
        logging: wrapLogging('[AccountServices.updateStatus]'),
      });

      const logsPromises = ids.map(async (id) => {
        return await LogServices.recordStatusChangeLog(user, usrAccounts, id, active, { transaction });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }

  static async list({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[AccountServices.list] '),
    };

    if (ids && ids.lenth > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(usrAccounts, search, optionsQuery);

    return await paginateModel(usrAccounts, limit, page, optionsQuery);
  }

  static async details(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[AccountServices.list] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const account = await usrAccounts.findOne(optionsQuery);

    if (includeHistory) account.dataValues.history = await LogServices.getFullLogsHistory(account);

    return account;
  }

  static async update(user, id, { rolId } = {}) {
    const updateData = { rolId };

    const account = await usrAccounts.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccountServices.update] '),
    });

    const oldData = JSON.parse(JSON.stringify(account));

    return await sequelize.transaction(async (transaction) => {
      const updatedAccount = await account.update(updateData, {
        transaction,
        logging: wrapLogging('[AccountServices.update] ', updateData),
      });

      await LogServices.recordUpdateLog(user, usrAccounts, oldData, updatedAccount, { transaction });

      return updatedAccount;
    });
  }

  static async delete(user, id, { justification } = {}) {
    const account = await usrAccounts.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccountServices.delete]'),
    });

    return await sequelize.transaction(async (transaction) => {
      const deletedAccount = await account.destroy({
        force: true,
        transaction,
        logging: wrapLogging('[AccountServices.delete]'),
      });

      await LogServices.recordDeletionLog(user, usrAccounts, deletedAccount, { justification, transaction });

      return deletedAccount;
    });
  }
}

module.exports = AccountServices;
