// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LogServices = require('../logs/logs.service');
const { getSequelize } = require('../../../config/database/connection');
const { bulkToggleSoftDelete, paginateModel, setSearchQuery } = require('../../../helpers/database.helper');
const { wrapLogging } = require('../../../helpers/debug.helper');

class {{SERVICE_NAME}} {
  constructor(sequelize = null) {
    this.sequelize = sequelize;
    this.models = sequelize ? sequelize.models : null;
    this.logService = null;
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
  async {{CREATE_METHOD}}(user, {{REQUIRED_FIELDS}}, { {{OPTIONAL_FIELDS}}, t } = {}) {
    const createData = { {{ALL_DATA}} };

    return await this.sequelize.transaction(async (transaction) => {
      const {{SINGLE_NAME}} = await this.models.{{MAIN_MODEL}}.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{CREATE_METHOD}}] ', createData),
      });

      await this.logService.recordCreationLog(user, this.models.{{MAIN_MODEL}}, {{SINGLE_NAME}}, { transaction: t || transaction });

      return {{SINGLE_NAME}};
    });
  }

  async {{UPDATE_STATUS_METHOD}}(user, ids, active) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.{{MAIN_MODEL}}, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{UPDATE_STATUS_METHOD}}]'),
      });

      const logsPromises = ids.map(async (id) => {
        return await this.logService.recordStatusChangeLog(user, this.models.{{MAIN_MODEL}}, id, active, { transaction: t || transaction });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }

  async {{LIST_METHOD}}({ limit, page, search, ids = [], fields = [], active, {{FILTERS}} } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        {{INCLUDES}}
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{LIST_METHOD}}] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    // Set FILTERS here

    if (search) optionsQuery.where = setSearchQuery(this.models.{{MAIN_MODEL}}, search, optionsQuery);

    return await paginateModel(this.models.{{MAIN_MODEL}}, limit, page, optionsQuery);
  }

  async {{DETAILS_METHOD}}(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        {{INCLUDES}}
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{DETAILS_METHOD}}] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const {{SINGLE_NAME}} = await this.models.{{MAIN_MODEL}}.findOne(optionsQuery);

    if (includeHistory) {{SINGLE_NAME}}.dataValues.history = await this.logService.getFullLogsHistory({{SINGLE_NAME}});

    return {{SINGLE_NAME}};
  }

  async {{UPDATE_METHOD}}(user, id, { {{ALL_DATA}} } = {}) {
    const updateData = { {{ALL_DATA}} };

    const {{SINGLE_NAME}} = await this.models.{{MAIN_MODEL}}.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{UPDATE_METHOD}}] '),
    });

    const oldData = JSON.parse(JSON.stringify({{SINGLE_NAME}}));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await {{SINGLE_NAME}}.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{UPDATE_METHOD}}] ', updateData),
      });

      await this.logService.recordUpdateLog(user, this.models.{{MAIN_MODEL}}, oldData, updatedData, { transaction: t || transaction });

      return updatedData;
    });
  }

  async {{DELETE_METHOD}}(user, id, { justification } = {}) {
    const {{SINGLE_NAME}} = await this.models.{{MAIN_MODEL}}.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{DELETE_METHOD}}]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await {{SINGLE_NAME}}.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{DELETE_METHOD}}]'),
      });

      await this.logService.recordDeletionLog(user, this.models.{{MAIN_MODEL}}, deletedData, { justification, transaction: t || transaction });

      return deletedData;
    });
  }
}

module.exports = {{SERVICE_NAME}};
