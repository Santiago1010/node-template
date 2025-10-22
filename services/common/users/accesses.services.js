// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LogServices = require('../logs/logs.service');
const { getSequelize } = require('../../../config/database/connection');
const { bulkToggleSoftDelete, paginateModel, setSearchQuery } = require('../../../helpers/database.helper');
const { wrapLogging } = require('../../../helpers/debug.helper');

class AccessServices {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;
    this.logService = new LogServices(this.sequelize);

    return this;
  }

  async initialize() {
    if (!this.sequelize) {
      this.sequelize = await getSequelize();
      this.models = this.sequelize.models;
    }

    this.logService = new LogServices(this.sequelize);

    return this;
  }

  // ================================= CRUD ================================= //
  async createAccess(accountId, deviceId, idToken, expiresAt, { isSafeMode, user } = {}) {
    const createData = { accountId, deviceId, idToken, expiresAt, isSafeMode };

    return await this.sequelize.transaction(async (transaction) => {
      await this.models.usrAccesses.destroy({ where: { accountId, deviceId }, transaction });

      const access = await this.models.usrAccesses.create(createData, {
        transaction,
        logging: wrapLogging('[AccessServices.createAccess] ', createData),
      });

      if (user) await this.logService.recordCreationLog(user, this.models.usrAccesses, access, { transaction });

      return access;
    });
  }

  async updateAccessesStatus(user, ids, active, { t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.usrAccesses, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[AccessServices.updateAccessesStatus]'),
      });

      const logsPromises = ids.map(async (id) => {
        return await this.logService.recordStatusChangeLog(user, this.models.usrAccesses, id, active, {
          transaction: t || transaction,
        });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }

  async getListAccesses({
    limit,
    page,
    search,
    ids = [],
    fields = [],
    active,
    accountId,
    deviceId,
    idToken,
    notBefore,
  } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: this.models.usrAccounts, as: 'usraccounts' }
        // { model: this.models.usrDevices, as: 'usrdevices' }
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

    if (idToken) optionsQuery.where.idToken = idToken;

    if (notBefore) optionsQuery.where.expiresAt = { [Op.gte]: notBefore };

    if (search) optionsQuery.where = setSearchQuery(this.models.usrAccesses, search, optionsQuery);

    return await paginateModel(this.models.usrAccesses, limit, page, optionsQuery);
  }

  async getAccessDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // { model: this.models.usrAccounts, as: 'usraccounts' }
        // { model: this.models.usrDevices, as: 'usrdevices' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[AccessServices.getAccessDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const access = await this.models.usrAccesses.findOne(optionsQuery);

    if (includeHistory) access.dataValues.history = await this.logService.getFullLogsHistory(access);

    return access;
  }

  async updateAccess(id, { accountId, deviceId, idToken, expiresAt, isSafeMode, active, user, t } = {}) {
    const updateData = { accountId, deviceId, idToken, expiresAt, isSafeMode };

    const access = await this.models.usrAccesses.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccessServices.updateAccess] '),
    });

    const oldData = JSON.parse(JSON.stringify(access));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await access.update(updateData, {
        transaction,
        logging: wrapLogging('[AccessServices.updateAccess] ', updateData),
      });

      if (active !== undefined) await this.updateAccessesStatus(user, [id], active);

      if (user && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(user, this.models.usrAccesses, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteAccess(user, id, { justification } = {}) {
    const access = await this.models.usrAccesses.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccessServices.deleteAccess]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await access.destroy({
        force: true,
        transaction,
        logging: wrapLogging('[AccessServices.deleteAccess]'),
      });

      await this.logService.recordDeletionLog(user, this.models.usrAccesses, deletedData, {
        justification,
        transaction,
      });

      return deletedData;
    });
  }
}

module.exports = AccessServices;
