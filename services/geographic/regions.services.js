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

class RegionServices {
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
  async createRegion(continentId, name, { actor, t } = {}) {
    const createData = { continentId, name };

    return await this.sequelize.transaction(async (transaction) => {
      const region = await this.models.geoRegions.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[RegionServices.createRegion] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.geoRegions, region, {
          transaction: t || transaction,
        });
      }

      return region;
    });
  }

  async updateRegionsStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.geoRegions, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[RegionServices.updateRegionsStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.geoRegions, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListRegions({ limit, page, search, ids = [], fields = [], active, continentId } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: geoContinents, as: 'geocontinents' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[RegionServices.getListRegions] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (continentId !== undefined) optionsQuery.where.continentId = continentId;

    if (search) optionsQuery.where = setSearchQuery(this.models.geoRegions, search, optionsQuery);

    return await paginateModel(this.models.geoRegions, limit, page, optionsQuery);
  }

  async getRegionDetails({ id, search, fields = [], active, continentId, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: geoContinents, as: 'geocontinents' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[RegionServices.getRegionDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (continentId !== undefined) optionsQuery.where.continentId = continentId;

    if (search) optionsQuery.where = setSearchQuery(this.models.geoRegions, search, optionsQuery);

    const region = await this.models.geoRegions.findOne(optionsQuery);

    if (includeHistory && region) region.dataValues.history = await this.logService.getFullLogsHistory(region);

    return region;
  }

  async updateRegion(id, { continentId, name, active, actor, t } = {}) {
    const updateData = { continentId, name };

    const region = await this.models.geoRegions.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[RegionServices.updateRegion] '),
    });

    const oldData = JSON.parse(JSON.stringify(region));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await region.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[RegionServices.updateRegion] ', updateData),
      });

      if (active !== undefined) await this.updateRegionsStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.geoRegions, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteRegion(id, { justification, actor, t } = {}) {
    const region = await this.models.geoRegions.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[RegionServices.deleteRegion]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await region.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[RegionServices.deleteRegion]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.geoRegions, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = RegionServices;
