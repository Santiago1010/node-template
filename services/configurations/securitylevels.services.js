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

class Security_levelServices {
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
  async createSecurity_level(slug, name, priority, isDefault, { description, actor, t } = {}) {
    const createData = { slug, name, priority, description, isDefault };

    return await this.sequelize.transaction(async (transaction) => {
      const securityLevel = await this.models.configSecurityLevels.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[Security_levelServices.createSecurity_level] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.configSecurityLevels, securityLevel, {
          transaction: t || transaction,
        });
      }

      return securityLevel;
    });
  }

  async updateSecuritylevelsStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.configSecurityLevels, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[Security_levelServices.updateSecuritylevelsStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.configSecurityLevels, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListSecuritylevels({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[Security_levelServices.getListSecuritylevels] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.configSecurityLevels, search, optionsQuery);

    return await paginateModel(this.models.configSecurityLevels, limit, page, optionsQuery);
  }

  async getSecurity_levelDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[Security_levelServices.getSecurity_levelDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.configSecurityLevels, search, optionsQuery);

    const securityLevel = await this.models.configSecurityLevels.findOne(optionsQuery);

    if (includeHistory && securityLevel)
      securityLevel.dataValues.history = await this.logService.getFullLogsHistory(securityLevel);

    return securityLevel;
  }

  async updateSecurity_level(id, { slug, name, priority, description, isDefault, active, actor, t } = {}) {
    const updateData = { slug, name, priority, description, isDefault };

    const securityLevel = await this.models.configSecurityLevels.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[Security_levelServices.updateSecurity_level] '),
    });

    const oldData = JSON.parse(JSON.stringify(securityLevel));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await securityLevel.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[Security_levelServices.updateSecurity_level] ', updateData),
      });

      if (active !== undefined) await this.updateSecuritylevelsStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.configSecurityLevels, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteSecurity_level(id, { justification, actor, t } = {}) {
    const securityLevel = await this.models.configSecurityLevels.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[Security_levelServices.deleteSecurity_level]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await securityLevel.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[Security_levelServices.deleteSecurity_level]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.configSecurityLevels, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = Security_levelServices;
