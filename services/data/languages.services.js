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

class LanguageServices {
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
  async createLanguage(abbreviation, name, { idFlag, version, description, orientation, isPublic, actor, t } = {}) {
    const createData = { idFlag, abbreviation, version, name, description, orientation, isPublic };

    return await this.sequelize.transaction(async (transaction) => {
      const language = await this.models.dataLanguages.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[LanguageServices.createLanguage] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.dataLanguages, language, {
          transaction: t || transaction,
        });
      }

      return language;
    });
  }

  async updateLanguagesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.dataLanguages, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[LanguageServices.updateLanguagesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.dataLanguages, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListLanguages({ limit, page, search, ids = [], fields = [], active, orientation } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[LanguageServices.getListLanguages] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (orientation) optionsQuery.where.orientation = orientation;

    if (search) optionsQuery.where = setSearchQuery(this.models.dataLanguages, search, optionsQuery);

    return await paginateModel(this.models.dataLanguages, limit, page, optionsQuery);
  }

  async getLanguageDetails({ id, search, fields = [], active, orientation, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[LanguageServices.getLanguageDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (orientation) optionsQuery.where.orientation = orientation;

    if (search) optionsQuery.where = setSearchQuery(this.models.dataLanguages, search, optionsQuery);

    const language = await this.models.dataLanguages.findOne(optionsQuery);

    if (includeHistory && language) language.dataValues.history = await this.logService.getFullLogsHistory(language);

    return language;
  }

  async updateLanguage(
    id,
    { idFlag, abbreviation, version, name, description, orientation, isPublic, active, actor, t } = {}
  ) {
    const updateData = { idFlag, abbreviation, version, name, description, orientation, isPublic };

    const language = await this.models.dataLanguages.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[LanguageServices.updateLanguage] '),
    });

    const oldData = JSON.parse(JSON.stringify(language));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await language.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[LanguageServices.updateLanguage] ', updateData),
      });

      if (active !== undefined) await this.updateLanguagesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.dataLanguages, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteLanguage(id, { justification, actor, t } = {}) {
    const language = await this.models.dataLanguages.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[LanguageServices.deleteLanguage]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await language.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[LanguageServices.deleteLanguage]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.dataLanguages, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = LanguageServices;
