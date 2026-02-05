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

class HostServices {
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
  async createHost(url, isDefault, { actor, t } = {}) {
    const createData = { url, isDefault };

    return await this.sequelize.transaction(async (transaction) => {
      const host = await this.models.configHosts.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[HostServices.createHost] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.configHosts, host, {
          transaction: t || transaction,
        });
      }

      return host;
    });
  }

  async updateHostsStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.configHosts, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[HostServices.updateHostsStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.configHosts, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListHosts({ limit, page, search, ids = [], fields = [], active, isDefault } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[HostServices.getListHosts] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (isDefault !== undefined) optionsQuery.where.isDefault = isDefault;

    if (search) optionsQuery.where = setSearchQuery(this.models.configHosts, search, optionsQuery);

    return await paginateModel(this.models.configHosts, limit, page, optionsQuery);
  }

  async getHostDetails({ id, search, fields = [], active, isDefault, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[HostServices.getHostDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (isDefault !== undefined) optionsQuery.where.isDefault = isDefault;

    if (search) optionsQuery.where = setSearchQuery(this.models.configHosts, search, optionsQuery);

    const host = await this.models.configHosts.findOne(optionsQuery);

    if (includeHistory && host) host.dataValues.history = await this.logService.getFullLogsHistory(host);

    return host;
  }

  async updateHost(id, { url, isDefault, active, actor, t } = {}) {
    const updateData = { url, isDefault };

    const host = await this.models.configHosts.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[HostServices.updateHost] '),
    });

    const oldData = JSON.parse(JSON.stringify(host));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await host.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[HostServices.updateHost] ', updateData),
      });

      if (active !== undefined) await this.updateHostsStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.configHosts, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteHost(id, { justification, actor, t } = {}) {
    const host = await this.models.configHosts.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[HostServices.deleteHost]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await host.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[HostServices.deleteHost]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.configHosts, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = HostServices;
