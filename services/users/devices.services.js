// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LogServices = require('../logs/logs.service');
const { getSequelize } = require('../../config/database/connection');
const { bulkToggleSoftDelete, paginateModel, setSearchQuery } = require('../../helpers/database.helper');
const { wrapLogging } = require('../../helpers/debug.helper');

class DeviceServices {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;
    this.logService = null;

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
  async createDevice(
    accountId,
    fingerprint,
    { name, type, browser, os, isTrusted, isBlocked, lastIp, lastUsedAt, user } = {}
  ) {
    const createData = { accountId, fingerprint, name, type, browser, os, isTrusted, isBlocked, lastIp, lastUsedAt };

    return await this.sequelize.transaction(async (transaction) => {
      const device = await this.models.usrDevices.create(createData, {
        transaction,
        logging: wrapLogging('[DeviceServices.createDevice] ', createData),
      });

      if (user) await LogServices.recordCreationLog(user, this.models.usrDevices, device, { transaction });

      return device;
    });
  }

  async updateDevicesStatus(user, ids, active) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.usrDevices, { id: { [Op.in]: ids } }, active, {
        transaction,
        logging: wrapLogging('[DeviceServices.updateDevicesStatus]'),
      });

      const logsPromises = ids.map(async (id) => {
        return await LogServices.recordStatusChangeLog(user, this.models.usrDevices, id, active, { transaction });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }

  async getListDevices({ limit, page, search, ids = [], fields = [], active, accountId, type } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[DeviceServices.getListDevices] '),
    };

    if (ids && ids.lenth > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (accountId) optionsQuery.where.accountId = accountId;
    if (type) optionsQuery.where.type = type;

    if (search) optionsQuery.where = setSearchQuery(this.models.usrDevices, search, optionsQuery);

    return await paginateModel(this.models.usrDevices, limit, page, optionsQuery);
  }

  async getDeviceDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[DeviceServices.getDeviceDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const device = await this.models.usrDevices.findOne(optionsQuery);

    if (includeHistory) device.dataValues.history = await LogServices.getFullLogsHistory(device);

    return device;
  }

  async updateDevice(
    id,
    { accountId, fingerprint, name, type, browser, os, isTrusted, isBlocked, lastIp, lastUsedAt, user } = {}
  ) {
    const updateData = { accountId, fingerprint, name, type, browser, os, isTrusted, isBlocked, lastIp, lastUsedAt };

    const device = await this.models.usrDevices.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[DeviceServices.updateDevice] '),
    });

    const oldData = JSON.parse(JSON.stringify(device));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await device.update(updateData, {
        transaction,
        logging: wrapLogging('[DeviceServices.updateDevice] ', updateData),
      });

      if (user) await LogServices.recordUpdateLog(user, this.models.usrDevices, oldData, updatedData, { transaction });

      return updatedData;
    });
  }

  async deleteDevice(user, id, { justification } = {}) {
    const device = await this.models.usrDevices.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[DeviceServices.deleteDevice]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await device.destroy({
        force: true,
        transaction,
        logging: wrapLogging('[DeviceServices.deleteDevice]'),
      });

      await LogServices.recordDeletionLog(user, this.models.usrDevices, deletedData, { justification, transaction });

      return deletedData;
    });
  }

  // =============================== HELPERS =============================== //
  async registeredDevice(accountId, fingerprint, type, browser, os) {
    const device = await this.models.usrDevices.findOne({
      where: { accountId, fingerprint, type, browser, os },
      paranoid: false,
      logging: wrapLogging('[DeviceServices.registeredDevice]'),
    });

    if (!device) return false;

    return JSON.parse(JSON.stringify(device));
  }
}

module.exports = DeviceServices;
