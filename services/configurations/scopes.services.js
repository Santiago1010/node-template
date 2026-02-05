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

class ScopeServices {
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
  async createScope(name, { description, isSelectable, actor, t } = {}) {
    const createData = { name, description, isSelectable };

    return await this.sequelize.transaction(async (transaction) => {
      const scope = await this.models.configScopes.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[ScopeServices.createScope] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.configScopes, scope, {
          transaction: t || transaction,
        });
      }

      return scope;
    });
  }

  async updateScopesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.configScopes, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[ScopeServices.updateScopesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.configScopes, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListScopes({ limit, page, search, ids = [], fields = [], active, isSelectable } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ScopeServices.getListScopes] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (isSelectable !== undefined) optionsQuery.where.isSelectable = isSelectable;

    if (search) optionsQuery.where = setSearchQuery(this.models.configScopes, search, optionsQuery);

    return await paginateModel(this.models.configScopes, limit, page, optionsQuery);
  }

  async getScopeDetails({ id, search, fields = [], active, isSelectable, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[ScopeServices.getScopeDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (isSelectable !== undefined) optionsQuery.where.isSelectable = isSelectable;

    if (search) optionsQuery.where = setSearchQuery(this.models.configScopes, search, optionsQuery);

    const scope = await this.models.configScopes.findOne(optionsQuery);

    if (includeHistory && scope) scope.dataValues.history = await this.logService.getFullLogsHistory(scope);

    return scope;
  }

  async updateScope(id, { name, description, isSelectable, active, actor, t } = {}) {
    const updateData = { name, description, isSelectable };

    const scope = await this.models.configScopes.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ScopeServices.updateScope] '),
    });

    const oldData = JSON.parse(JSON.stringify(scope));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await scope.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[ScopeServices.updateScope] ', updateData),
      });

      if (active !== undefined) await this.updateScopesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.configScopes, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteScope(id, { justification, actor, t } = {}) {
    const scope = await this.models.configScopes.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[ScopeServices.deleteScope]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await scope.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[ScopeServices.deleteScope]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.configScopes, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }

  // ================================ UTILS ================================ //
  async getAllScopesOfAnAccount(accountId, roleId) {
    const scopes = new Set();

    const [accountScopes, roleScopes] = await Promise.all([
      await this.models.configScopes.findAll({
        attributes: ['name'],
        include: {
          model: this.models.usrAccounts,
          as: 'accounts',
          through: { attributes: [] },
          attributes: [],
          where: { id: accountId },
          required: true,
        },
        subQuery: false,
        raw: true,
        logging: wrapLogging('[ScopeServices.getAllScopesOfAnAccount] Get account scopes'),
      }),
      await this.models.configScopes.findAll({
        attributes: ['name'],
        include: {
          model: this.models.configRoles,
          as: 'roles',
          through: { attributes: [] },
          attributes: [],
          where: { id: roleId },
          required: true,
        },
        subQuery: false,
        raw: true,
        logging: wrapLogging('[ScopeServices.getAllScopesOfAnAccount] Get role scopes'),
      }),
    ]);

    for (const { name } of accountScopes) scopes.add(name);
    for (const { name } of roleScopes) scopes.add(name);

    return Array.from(scopes);
  }
}

module.exports = ScopeServices;
