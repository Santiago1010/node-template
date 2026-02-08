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

class ShortenerServices {
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
  async createShortener(url, codeShortener, { expiresAt, actor, t } = {}) {
    const createData = { url, codeShortener, expiresAt };

    return await this.sequelize.transaction(async (transaction) => {
      const shortener = await this.models.configShorteners.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[ShortenerServices.createShortener] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.configShorteners, shortener, {
          transaction: t || transaction,
        });
      }

      return shortener;
    });
  }

  async updateShortenersStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.configShorteners, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[ShortenerServices.updateShortenersStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.configShorteners, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListShorteners({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ShortenerServices.getListShorteners] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.configShorteners, search, optionsQuery);

    return await paginateModel(this.models.configShorteners, limit, page, optionsQuery);
  }

  async getShortenerDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ShortenerServices.getShortenerDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.configShorteners, search, optionsQuery);

    const shortener = await this.models.configShorteners.findOne(optionsQuery);

    if (includeHistory && shortener) shortener.dataValues.history = await this.logService.getFullLogsHistory(shortener);

    return shortener;
  }

  async updateShortener(id, { url, codeShortener, expiresAt, active, actor, t } = {}) {
    const updateData = { url, codeShortener, expiresAt };

    const shortener = await this.models.configShorteners.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ShortenerServices.updateShortener] '),
    });

    const oldData = JSON.parse(JSON.stringify(shortener));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await shortener.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[ShortenerServices.updateShortener] ', updateData),
      });

      if (active !== undefined) await this.updateShortenersStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.configShorteners, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteShortener(id, { justification, actor, t } = {}) {
    const shortener = await this.models.configShorteners.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ShortenerServices.deleteShortener]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await shortener.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[ShortenerServices.deleteShortener]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.configShorteners, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = ShortenerServices;
