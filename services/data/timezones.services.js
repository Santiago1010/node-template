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

class TimezoneServices {
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
  async createTimezone(idContinent, name, utc, { actor, t } = {}) {
    const createData = { idContinent, name, utc };

    return await this.sequelize.transaction(async (transaction) => {
      const timezone = await this.models.dataTimezones.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[TimezoneServices.createTimezone] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.dataTimezones, timezone, {
          transaction: t || transaction,
        });
      }

      return timezone;
    });
  }

  async updateTimezonesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.dataTimezones, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[TimezoneServices.updateTimezonesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.dataTimezones, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListTimezones({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[TimezoneServices.getListTimezones] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.dataTimezones, search, optionsQuery);

    return await paginateModel(this.models.dataTimezones, limit, page, optionsQuery);
  }

  async getTimezoneDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[TimezoneServices.getTimezoneDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.dataTimezones, search, optionsQuery);

    const timezone = await this.models.dataTimezones.findOne(optionsQuery);

    if (includeHistory && timezone) timezone.dataValues.history = await this.logService.getFullLogsHistory(timezone);

    return timezone;
  }

  async updateTimezone(id, { idContinent, name, utc, active, actor, t } = {}) {
    const updateData = { idContinent, name, utc };

    const timezone = await this.models.dataTimezones.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[TimezoneServices.updateTimezone] '),
    });

    const oldData = JSON.parse(JSON.stringify(timezone));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await timezone.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[TimezoneServices.updateTimezone] ', updateData),
      });

      if (active !== undefined) await this.updateTimezonesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.dataTimezones, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteTimezone(id, { justification, actor, t } = {}) {
    const timezone = await this.models.dataTimezones.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[TimezoneServices.deleteTimezone]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await timezone.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[TimezoneServices.deleteTimezone]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.dataTimezones, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = TimezoneServices;
