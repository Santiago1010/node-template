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

class CurrencyServices {
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
  async createCurrency(name, abbreviation, symbol, { actor, t } = {}) {
    const createData = { name, abbreviation, symbol };

    return await this.sequelize.transaction(async (transaction) => {
      const currency = await this.models.dataCurrencies.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[CurrencyServices.createCurrency] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.dataCurrencies, currency, {
          transaction: t || transaction,
        });
      }

      return currency;
    });
  }

  async updateCurrenciesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.dataCurrencies, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[CurrencyServices.updateCurrenciesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.dataCurrencies, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListCurrencies({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CurrencyServices.getListCurrencies] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.dataCurrencies, search, optionsQuery);

    return await paginateModel(this.models.dataCurrencies, limit, page, optionsQuery);
  }

  async getCurrencyDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CurrencyServices.getCurrencyDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.dataCurrencies, search, optionsQuery);

    const currency = await this.models.dataCurrencies.findOne(optionsQuery);

    if (includeHistory && currency) currency.dataValues.history = await this.logService.getFullLogsHistory(currency);

    return currency;
  }

  async updateCurrency(id, { name, abbreviation, symbol, active, actor, t } = {}) {
    const updateData = { name, abbreviation, symbol };

    const currency = await this.models.dataCurrencies.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CurrencyServices.updateCurrency] '),
    });

    const oldData = JSON.parse(JSON.stringify(currency));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await currency.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[CurrencyServices.updateCurrency] ', updateData),
      });

      if (active !== undefined) await this.updateCurrenciesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.dataCurrencies, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteCurrency(id, { justification, actor, t } = {}) {
    const currency = await this.models.dataCurrencies.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CurrencyServices.deleteCurrency]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await currency.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[CurrencyServices.deleteCurrency]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.dataCurrencies, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = CurrencyServices;
