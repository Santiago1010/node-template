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

class Dial_codeServices {
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
  async createDial_code(countryId, code, mask, { actor, t } = {}) {
    const createData = { countryId, code, mask };

    return await this.sequelize.transaction(async (transaction) => {
      const dialCode = await this.models.geoDialCodes.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[Dial_codeServices.createDial_code] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.geoDialCodes, dialCode, {
          transaction: t || transaction,
        });
      }

      return dialCode;
    });
  }

  async updateDialcodesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.geoDialCodes, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[Dial_codeServices.updateDialcodesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.geoDialCodes, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListDialcodes({ limit, page, search, ids = [], fields = [], active, countryId } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: geoCountries, as: 'geocountries' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[Dial_codeServices.getListDialcodes] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (countryId) optionsQuery.where.countryId = countryId;

    if (search) optionsQuery.where = setSearchQuery(this.models.geoDialCodes, search, optionsQuery);

    return await paginateModel(this.models.geoDialCodes, limit, page, optionsQuery);
  }

  async getDial_codeDetails({ id, search, fields = [], active, countryId, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: geoCountries, as: 'geocountries' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[Dial_codeServices.getDial_codeDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (countryId) optionsQuery.where.countryId = countryId;

    if (search) optionsQuery.where = setSearchQuery(this.models.geoDialCodes, search, optionsQuery);

    const dialCode = await this.models.geoDialCodes.findOne(optionsQuery);

    if (includeHistory && dialCode) dialCode.dataValues.history = await this.logService.getFullLogsHistory(dialCode);

    return dialCode;
  }

  async updateDial_code(id, { countryId, code, mask, active, actor, t } = {}) {
    const updateData = { countryId, code, mask };

    const dialCode = await this.models.geoDialCodes.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[Dial_codeServices.updateDial_code] '),
    });

    const oldData = JSON.parse(JSON.stringify(dialCode));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await dialCode.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[Dial_codeServices.updateDial_code] ', updateData),
      });

      if (active !== undefined) await this.updateDialcodesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.geoDialCodes, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteDial_code(id, { justification, actor, t } = {}) {
    const dialCode = await this.models.geoDialCodes.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[Dial_codeServices.deleteDial_code]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await dialCode.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[Dial_codeServices.deleteDial_code]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.geoDialCodes, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = Dial_codeServices;
