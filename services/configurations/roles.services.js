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

class RoleServices {
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
  async createRole(securityLevelId, name, { target, isDefault, actor, t } = {}) {
    const createData = { securityLevelId, name, target, isDefault };

    return await this.sequelize.transaction(async (transaction) => {
      const role = await this.models.configRoles.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[RoleServices.createRole] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.configRoles, role, {
          transaction: t || transaction,
        });
      }

      return role;
    });
  }

  async updateRolesStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.configRoles, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[RoleServices.updateRolesStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.configRoles, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListRoles({ limit, page, search, ids = [], fields = [], active, securityLevelId, target } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: configSecurityLevels, as: 'configsecuritylevels' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[RoleServices.getListRoles] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (securityLevelId) optionsQuery.where.securityLevelId = securityLevelId;
    if (target) optionsQuery.where.target = target;

    if (search) optionsQuery.where = setSearchQuery(this.models.configRoles, search, optionsQuery);

    return await paginateModel(this.models.configRoles, limit, page, optionsQuery);
  }

  async getRoleDetails({ id, search, fields = [], active, securityLevelId, target, includeHistory = false } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: configSecurityLevels, as: 'configsecuritylevels' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[RoleServices.getRoleDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (securityLevelId) optionsQuery.where.securityLevelId = securityLevelId;
    if (target) optionsQuery.where.target = target;

    if (search) optionsQuery.where = setSearchQuery(this.models.configRoles, search, optionsQuery);

    const role = await this.models.configRoles.findOne(optionsQuery);

    if (includeHistory && role) role.dataValues.history = await this.logService.getFullLogsHistory(role);

    return role;
  }

  async updateRole(id, { securityLevelId, name, target, isDefault, active, actor, t } = {}) {
    const updateData = { securityLevelId, name, target, isDefault };

    const role = await this.models.configRoles.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[RoleServices.updateRole] '),
    });

    const oldData = JSON.parse(JSON.stringify(role));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await role.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[RoleServices.updateRole] ', updateData),
      });

      if (active !== undefined) await this.updateRolesStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.configRoles, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteRole(id, { justification, actor, t } = {}) {
    const role = await this.models.configRoles.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[RoleServices.deleteRole]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await role.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[RoleServices.deleteRole]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.configRoles, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = RoleServices;
