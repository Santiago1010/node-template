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

class CountryServices {
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
  async createCountry(
    idRegion,
    idFlag,
    popularName,
    officialName,
    abbreviation,
    tld,
    { idCapital, surfaceArea, actor, t } = {}
  ) {
    const createData = { idRegion, idCapital, idFlag, popularName, officialName, abbreviation, surfaceArea, tld };

    return await this.sequelize.transaction(async (transaction) => {
      const country = await this.models.geoCountries.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[CountryServices.createCountry] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.geoCountries, country, {
          transaction: t || transaction,
        });
      }

      return country;
    });
  }

  async updateCountriesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.geoCountries, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[CountryServices.updateCountriesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.geoCountries, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListCountries({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CountryServices.getListCountries] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoCountries, search, optionsQuery);

    return await paginateModel(this.models.geoCountries, limit, page, optionsQuery);
  }

  async getCountryDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CountryServices.getCountryDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoCountries, search, optionsQuery);

    const country = await this.models.geoCountries.findOne(optionsQuery);

    if (includeHistory && country) country.dataValues.history = await this.logService.getFullLogsHistory(country);

    return country;
  }

  async updateCountry(
    id,
    { idRegion, idCapital, idFlag, popularName, officialName, abbreviation, surfaceArea, tld, active, actor, t } = {}
  ) {
    const updateData = { idRegion, idCapital, idFlag, popularName, officialName, abbreviation, surfaceArea, tld };

    const country = await this.models.geoCountries.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CountryServices.updateCountry] '),
    });

    const oldData = JSON.parse(JSON.stringify(country));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await country.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[CountryServices.updateCountry] ', updateData),
      });

      if (active !== undefined) await this.updateCountriesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.geoCountries, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteCountry(id, { justification, actor, t } = {}) {
    const country = await this.models.geoCountries.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CountryServices.deleteCountry]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await country.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[CountryServices.deleteCountry]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.geoCountries, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = CountryServices;
