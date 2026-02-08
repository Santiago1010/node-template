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

class ContinentServices {
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
  async createContinent(name, abbreviation, surfaceArea, { actor, t } = {}) {
    const createData = { name, abbreviation, surfaceArea };

    return await this.sequelize.transaction(async (transaction) => {
      const continent = await this.models.geoContinents.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[ContinentServices.createContinent] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.geoContinents, continent, {
          transaction: t || transaction,
        });
      }

      return continent;
    });
  }

  async updateContinentsStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.geoContinents, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[ContinentServices.updateContinentsStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.geoContinents, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListContinents({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ContinentServices.getListContinents] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoContinents, search, optionsQuery);

    return await paginateModel(this.models.geoContinents, limit, page, optionsQuery);
  }

  async getContinentDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ContinentServices.getContinentDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoContinents, search, optionsQuery);

    const continent = await this.models.geoContinents.findOne(optionsQuery);

    if (includeHistory && continent) continent.dataValues.history = await this.logService.getFullLogsHistory(continent);

    return continent;
  }

  async updateContinent(id, { name, abbreviation, surfaceArea, active, actor, t } = {}) {
    const updateData = { name, abbreviation, surfaceArea };

    const continent = await this.models.geoContinents.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ContinentServices.updateContinent] '),
    });

    const oldData = JSON.parse(JSON.stringify(continent));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await continent.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[ContinentServices.updateContinent] ', updateData),
      });

      if (active !== undefined) await this.updateContinentsStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.geoContinents, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteContinent(id, { justification, actor, t } = {}) {
    const continent = await this.models.geoContinents.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ContinentServices.deleteContinent]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await continent.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[ContinentServices.deleteContinent]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.geoContinents, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = ContinentServices;
