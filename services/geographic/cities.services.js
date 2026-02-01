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

class CityServices {
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
  async createCity(idSubDivision, idTimezone, name, { actor, t } = {}) {
    const createData = { idSubDivision, idTimezone, name };

    return await this.sequelize.transaction(async (transaction) => {
      const city = await this.models.geoCities.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[CityServices.createCity] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.geoCities, city, {
          transaction: t || transaction,
        });
      }

      return city;
    });
  }

  async updateCitiesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.geoCities, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[CityServices.updateCitiesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.geoCities, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListCities({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CityServices.getListCities] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoCities, search, optionsQuery);

    return await paginateModel(this.models.geoCities, limit, page, optionsQuery);
  }

  async getCityDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CityServices.getCityDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoCities, search, optionsQuery);

    const city = await this.models.geoCities.findOne(optionsQuery);

    if (includeHistory && city) city.dataValues.history = await this.logService.getFullLogsHistory(city);

    return city;
  }

  async updateCity(id, { idSubDivision, idTimezone, name, active, actor, t } = {}) {
    const updateData = { idSubDivision, idTimezone, name };

    const city = await this.models.geoCities.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CityServices.updateCity] '),
    });

    const oldData = JSON.parse(JSON.stringify(city));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await city.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[CityServices.updateCity] ', updateData),
      });

      if (active !== undefined) await this.updateCitiesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.geoCities, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteCity(id, { justification, actor, t } = {}) {
    const city = await this.models.geoCities.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CityServices.deleteCity]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await city.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[CityServices.deleteCity]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.geoCities, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = CityServices;
