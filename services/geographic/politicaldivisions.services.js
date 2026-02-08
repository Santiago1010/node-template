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

class Political_divisionServices {
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
  async createPolitical_division({ actor, t } = {}) {
    const createData = {};

    return await this.sequelize.transaction(async (transaction) => {
      const politicalDivision = await this.models.geoPoliticalDivisions.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[Political_divisionServices.createPolitical_division] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.geoPoliticalDivisions, politicalDivision, {
          transaction: t || transaction,
        });
      }

      return politicalDivision;
    });
  }

  async updatePoliticaldivisionsStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.geoPoliticalDivisions, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[Political_divisionServices.updatePoliticaldivisionsStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.geoPoliticalDivisions, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListPoliticaldivisions({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[Political_divisionServices.getListPoliticaldivisions] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoPoliticalDivisions, search, optionsQuery);

    return await paginateModel(this.models.geoPoliticalDivisions, limit, page, optionsQuery);
  }

  async getPolitical_divisionDetails({ id, search, fields = [], active, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[Political_divisionServices.getPolitical_divisionDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.geoPoliticalDivisions, search, optionsQuery);

    const politicalDivision = await this.models.geoPoliticalDivisions.findOne(optionsQuery);

    if (includeHistory && politicalDivision)
      politicalDivision.dataValues.history = await this.logService.getFullLogsHistory(politicalDivision);

    return politicalDivision;
  }

  async updatePolitical_division(id, { active, actor, t } = {}) {
    const updateData = {};

    const politicalDivision = await this.models.geoPoliticalDivisions.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[Political_divisionServices.updatePolitical_division] '),
    });

    const oldData = JSON.parse(JSON.stringify(politicalDivision));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await politicalDivision.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[Political_divisionServices.updatePolitical_division] ', updateData),
      });

      if (active !== undefined) await this.updatePoliticaldivisionsStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.geoPoliticalDivisions, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deletePolitical_division(id, { justification, actor, t } = {}) {
    const politicalDivision = await this.models.geoPoliticalDivisions.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[Political_divisionServices.deletePolitical_division]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await politicalDivision.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[Political_divisionServices.deletePolitical_division]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.geoPoliticalDivisions, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = Political_divisionServices;
