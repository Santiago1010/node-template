// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LogServices = require('../logs/logs.service');
const sequelize = require('../../config/database/connection');
const { bulkToggleSoftDelete, paginateModel, setSearchQuery } = require('../../helpers/database.helper');
const { wrapLogging } = require('../../helpers/debug.helper');

// =============================================================================
// MODELS
// =============================================================================
const { {{MAIN_MODEL}} } = sequelize.models;

class {{SERVICE_NAME}} {
  // ================================= CRUD ================================= //
  static async {{CREATE_METHOD}}(user, {{REQUIRED_FIELDS}}, { {{OPTIONAL_FIELDS}} } = {}) {
    const createData = { {{ALL_DATA}} };

    return await sequelize.transaction(async (transaction) => {
      const {{SINGLE_NAME}} = await {{MAIN_MODEL}}.create(createData, {
        transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{CREATE_METHOD}}] ', createData),
      });

      await LogServices.recordCreationLog(user, {{MAIN_MODEL}}, {{SINGLE_NAME}}, { transaction });

      return {{SINGLE_NAME}};
    });
  }

  static async {{UPDATE_STATUS_METHOD}}(user, ids, active) {
    return await sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete({{MAIN_MODEL}}, { id: { [Op.in]: ids } }, active, {
        transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{UPDATE_STATUS_METHOD}}]'),
      });

      const logsPromises = ids.map(async (id) => {
        return await LogServices.recordStatusChangeLog(user, {{MAIN_MODEL}}, id, active, { transaction });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }

  static async {{LIST_METHOD}}({ limit, page, search, ids = [], fields = [], active, {{FILTERS}} } = {}) {
    const optionsQuery = {
      where: {},
      include: [{{INCLUDES}}],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{LIST_METHOD}}] '),
    };

    if (ids && ids.lenth > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery({{MAIN_MODEL}}, search, optionsQuery);

    return await paginateModel({{MAIN_MODEL}}, limit, page, optionsQuery);
  }

  static async {{DETAILS_METHOD}}(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{DETAILS_METHOD}}] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const {{SINGLE_NAME}} = await {{MAIN_MODEL}}.findOne(optionsQuery);

    if (includeHistory) {{SINGLE_NAME}}.dataValues.history = await LogServices.getFullLogsHistory({{SINGLE_NAME}});

    return {{SINGLE_NAME}};
  }

  static async {{UPDATE_METHOD}}(user, id, { {{ALL_DATA}} } = {}) {
    const updateData = { {{ALL_DATA}} };

    const {{SINGLE_NAME}} = await {{MAIN_MODEL}}.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{UPDATE_METHOD}}] '),
    });

    const oldData = JSON.parse(JSON.stringify({{SINGLE_NAME}}));

    return await sequelize.transaction(async (transaction) => {
      const updatedData = await {{SINGLE_NAME}}.update(updateData, {
        transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{UPDATE_METHOD}}] ', updateData),
      });

      await LogServices.recordUpdateLog(user, {{MAIN_MODEL}}, oldData, updatedData, { transaction });

      return updatedData;
    });
  }

  static async {{DELETE_METHOD}}(user, id, { justification } = {}) {
    const {{SINGLE_NAME}} = await {{MAIN_MODEL}}.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[{{SERVICE_NAME}}.{{DELETE_METHOD}}]'),
    });

    return await sequelize.transaction(async (transaction) => {
      const deletedData = await {{SINGLE_NAME}}.destroy({
        force: true,
        transaction,
        logging: wrapLogging('[{{SERVICE_NAME}}.{{DELETE_METHOD}}]'),
      });

      await LogServices.recordDeletionLog(user, {{MAIN_MODEL}}, deletedData, { justification, transaction });

      return deletedData;
    });
  }
}

module.exports = {{SERVICE_NAME}};
