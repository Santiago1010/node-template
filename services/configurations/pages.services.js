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

class PageServices {
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
  async createPage(
    hostId,
    name,
    path,
    { pageId, description, level, requiresAuthorization, hasSensitiveInformation, actor, t } = {}
  ) {
    const createData = {
      hostId,
      pageId,
      name,
      path,
      description,
      level,
      requiresAuthorization,
      hasSensitiveInformation,
    };

    return await this.sequelize.transaction(async (transaction) => {
      const page = await this.models.configPages.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[PageServices.createPage] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.configPages, page, {
          transaction: t || transaction,
        });
      }

      return page;
    });
  }

  async updatePagesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.configPages, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[PageServices.updatePagesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.configPages, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListPages({
    limit,
    page,
    search,
    ids = [],
    fields = [],
    active,
    hostId,
    pageId,
    requiresAuthorization,
    hasSensitiveInformation,
  } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: configHosts, as: 'confighosts' }
        // { model: configPages, as: 'configpages' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[PageServices.getListPages] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (hostId !== undefined) optionsQuery.where.hostId = hostId;
    if (pageId !== undefined) optionsQuery.where.pageId = pageId;
    if (requiresAuthorization !== undefined) optionsQuery.where.requiresAuthorization = requiresAuthorization;
    if (hasSensitiveInformation !== undefined) optionsQuery.where.hasSensitiveInformation = hasSensitiveInformation;

    if (search) optionsQuery.where = setSearchQuery(this.models.configPages, search, optionsQuery);

    return await paginateModel(this.models.configPages, limit, page, optionsQuery);
  }

  async getPageDetails({
    id,
    search,
    fields = [],
    active,
    hostId,
    pageId,
    requiresAuthorization,
    hasSensitiveInformation,
    includeHistory = false,
  } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: configHosts, as: 'confighosts' }
        // { model: configPages, as: 'configpages' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[PageServices.getPageDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (hostId !== undefined) optionsQuery.where.hostId = hostId;
    if (pageId !== undefined) optionsQuery.where.pageId = pageId;
    if (requiresAuthorization !== undefined) optionsQuery.where.requiresAuthorization = requiresAuthorization;
    if (hasSensitiveInformation !== undefined) optionsQuery.where.hasSensitiveInformation = hasSensitiveInformation;

    if (search) optionsQuery.where = setSearchQuery(this.models.configPages, search, optionsQuery);

    const page = await this.models.configPages.findOne(optionsQuery);

    if (includeHistory && page) page.dataValues.history = await this.logService.getFullLogsHistory(page);

    return page;
  }

  async updatePage(
    id,
    {
      hostId,
      pageId,
      name,
      path,
      description,
      level,
      requiresAuthorization,
      hasSensitiveInformation,
      active,
      actor,
      t,
    } = {}
  ) {
    const updateData = {
      hostId,
      pageId,
      name,
      path,
      description,
      level,
      requiresAuthorization,
      hasSensitiveInformation,
    };

    const page = await this.models.configPages.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[PageServices.updatePage] '),
    });

    const oldData = JSON.parse(JSON.stringify(page));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await page.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[PageServices.updatePage] ', updateData),
      });

      if (active !== undefined) await this.updatePagesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.configPages, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deletePage(id, { justification, actor, t } = {}) {
    const page = await this.models.configPages.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[PageServices.deletePage]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await page.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[PageServices.deletePage]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.configPages, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = PageServices;
