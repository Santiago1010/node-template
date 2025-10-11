// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { Op } = require('sequelize');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const LogServices = require('../logs/logs.service');
const sequelize = require('../../../config/database/connection');
const { bulkToggleSoftDelete, paginateModel, setSearchQuery } = require('../../../helpers/database.helper');
const { wrapLogging } = require('../../../helpers/debug.helper');

// =============================================================================
// MODELS
// =============================================================================
const { configScopes } = sequelize.models;

class ScopeServices {
  // ================================= CRUD ================================= //
  static async createScope(user, name, description) {
    const createData = { name, description };

    return await sequelize.transaction(async (transaction) => {
      const scope = await configScopes.create(createData, {
        transaction,
        logging: wrapLogging('[ScopeServices.createScope] ', createData),
      });

      await LogServices.recordCreationLog(user, configScopes, scope, { transaction });

      return scope;
    });
  }

  static async updateScopesStatus(user, ids, active) {
    return await sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(configScopes, { id: { [Op.in]: ids } }, active, {
        transaction,
        logging: wrapLogging('[ScopeServices.updateScopesStatus]'),
      });

      const logsPromises = ids.map(async (id) => {
        return await LogServices.recordStatusChangeLog(user, configScopes, id, active, { transaction });
      });

      await Promise.all(logsPromises);

      return result;
    });
  }

  static async getListScopes({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ScopeServices.getListScopes] '),
    };

    if (ids && ids.lenth > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(configScopes, search, optionsQuery);

    return await paginateModel(configScopes, limit, page, optionsQuery);
  }

  static async getScopeDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ScopeServices.getScopeDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const scope = await configScopes.findOne(optionsQuery);

    if (includeHistory) scope.dataValues.history = await LogServices.getFullLogsHistory(scope);

    return scope;
  }

  static async updateScope(user, id, { name, description } = {}) {
    const updateData = { name, description };

    const scope = await configScopes.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ScopeServices.updateScope] '),
    });

    const oldData = JSON.parse(JSON.stringify(scope));

    return await sequelize.transaction(async (transaction) => {
      const updatedData = await scope.update(updateData, {
        transaction,
        logging: wrapLogging('[ScopeServices.updateScope] ', updateData),
      });

      await LogServices.recordUpdateLog(user, configScopes, oldData, updatedData, { transaction });

      return updatedData;
    });
  }

  static async deleteScope(user, id, { justification } = {}) {
    const scope = await configScopes.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ScopeServices.deleteScope]'),
    });

    return await sequelize.transaction(async (transaction) => {
      const deletedData = await scope.destroy({
        force: true,
        transaction,
        logging: wrapLogging('[ScopeServices.deleteScope]'),
      });

      await LogServices.recordDeletionLog(user, configScopes, deletedData, { justification, transaction });

      return deletedData;
    });
  }

  // ================================ UTILS ================================ //
  // static async getAllScopesOfAnAccount(accountId, roleId) {
  //   const [accountScopes, roleScopes] = await Promise.all([]);
  // }
}

module.exports = ScopeServices;
