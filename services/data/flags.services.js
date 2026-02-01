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

class FlagServices {
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
  async createFlag(name, emoji, { location, flat2d, rounded2d, wave2d, flat3d, rounded3d, wave3d, actor, t } = {}) {
    const createData = { name, emoji, location, flat2d, rounded2d, wave2d, flat3d, rounded3d, wave3d };

    return await this.sequelize.transaction(async (transaction) => {
      const flag = await this.models.dataFlags.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[FlagServices.createFlag] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.dataFlags, flag, {
          transaction: t || transaction,
        });
      }

      return flag;
    });
  }

  async updateFlagsStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.dataFlags, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[FlagServices.updateFlagsStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.dataFlags, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListFlags({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[FlagServices.getListFlags] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.dataFlags, search, optionsQuery);

    return await paginateModel(this.models.dataFlags, limit, page, optionsQuery);
  }

  async getFlagDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[FlagServices.getFlagDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.dataFlags, search, optionsQuery);

    const flag = await this.models.dataFlags.findOne(optionsQuery);

    if (includeHistory && flag) flag.dataValues.history = await this.logService.getFullLogsHistory(flag);

    return flag;
  }

  async updateFlag(
    id,
    { name, emoji, location, flat2d, rounded2d, wave2d, flat3d, rounded3d, wave3d, active, actor, t } = {}
  ) {
    const updateData = { name, emoji, location, flat2d, rounded2d, wave2d, flat3d, rounded3d, wave3d };

    const flag = await this.models.dataFlags.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[FlagServices.updateFlag] '),
    });

    const oldData = JSON.parse(JSON.stringify(flag));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await flag.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[FlagServices.updateFlag] ', updateData),
      });

      if (active !== undefined) await this.updateFlagsStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.dataFlags, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteFlag(id, { justification, actor, t } = {}) {
    const flag = await this.models.dataFlags.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[FlagServices.deleteFlag]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await flag.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[FlagServices.deleteFlag]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.dataFlags, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = FlagServices;
