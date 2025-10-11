// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LogServices = require('../logs/logs.service');
const sequelize = require('../../../config/database/connection');
const { bulkToggleSoftDelete, paginateModel, setSearchQuery } = require('../../../helpers/database.helper');
const { wrapLogging } = require('../../../helpers/debug.helper');

// =============================================================================
// MODELS
// =============================================================================
const { usrAccesses } = sequelize.models;

class AccessServices {
  // ================================= CRUD ================================= //
  static async createAccess(accountId, deviceId, idToken, { isSafeMode, user } = {}) {
    const createData = { accountId, deviceId, idToken, isSafeMode };

    return await sequelize.transaction(async (transaction) => {
      const access = await usrAccesses.create(createData, {
        transaction,
        logging: wrapLogging('[AccessServices.createAccess] ', createData),
      });

      if (user) await LogServices.recordCreationLog(user, usrAccesses, access, { transaction });

      return access;
    });
  }

  static async updateAccessesStatus(user, ids, active) {
    return await sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(usrAccesses, { id: { [Op.in]: ids } }, active, {
        transaction,
        logging: wrapLogging('[AccessServices.updateAccessesStatus]'),
      });

      const logsPromises = ids.map(async (id) => {
        return await LogServices.recordStatusChangeLog(user, usrAccesses, id, active, { transaction });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }

  static async getListAccesses({ limit, page, search, ids = [], fields = [], active, accountId, deviceId } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
        // { model: usrDevices, as: 'usrdevices' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[AccessServices.getListAccesses] '),
    };

    if (ids && ids.lenth > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (accountId) optionsQuery.where.accountId = accountId;
    if (deviceId) optionsQuery.where.deviceId = deviceId;

    if (search) optionsQuery.where = setSearchQuery(usrAccesses, search, optionsQuery);

    return await paginateModel(usrAccesses, limit, page, optionsQuery);
  }

  static async getAccessDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
        // { model: usrDevices, as: 'usrdevices' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[AccessServices.getAccessDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const access = await usrAccesses.findOne(optionsQuery);

    if (includeHistory) access.dataValues.history = await LogServices.getFullLogsHistory(access);

    return access;
  }

  static async updateAccess(user, id, { accountId, deviceId, idToken, isSafeMode } = {}) {
    const updateData = { accountId, deviceId, idToken, isSafeMode };

    const access = await usrAccesses.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccessServices.updateAccess] '),
    });

    const oldData = JSON.parse(JSON.stringify(access));

    return await sequelize.transaction(async (transaction) => {
      const updatedData = await access.update(updateData, {
        transaction,
        logging: wrapLogging('[AccessServices.updateAccess] ', updateData),
      });

      await LogServices.recordUpdateLog(user, usrAccesses, oldData, updatedData, { transaction });

      return updatedData;
    });
  }

  static async deleteAccess(user, id, { justification } = {}) {
    const access = await usrAccesses.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccessServices.deleteAccess]'),
    });

    return await sequelize.transaction(async (transaction) => {
      const deletedData = await access.destroy({
        force: true,
        transaction,
        logging: wrapLogging('[AccessServices.deleteAccess]'),
      });

      await LogServices.recordDeletionLog(user, usrAccesses, deletedData, { justification, transaction });

      return deletedData;
    });
  }
}

module.exports = AccessServices;
