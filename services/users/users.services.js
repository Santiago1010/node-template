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

class UserServices {
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
  async createUser(firstName, firstLastName, { secondName, secondLastName, userSession, t } = {}) {
    const createData = { firstName, secondName, firstLastName, secondLastName };

    return await this.sequelize.transaction(async (transaction) => {
      const user = await this.models.usrUsers.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[UserServices.createUser] ', createData),
      });

      if (userSession) {
        await this.logService.recordCreationLog(userSession, this.models.usrUsers, user, {
          transaction: t || transaction,
        });
      }

      return user;
    });
  }

  async updateUsersStatus(ids, active, { userSession, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.usrUsers, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[UserServices.updateUsersStatus]'),
      });

      if (userSession) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(userSession, this.models.usrUsers, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListUsers({ limit, page, search, ids = [], fields = [], active } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[UserServices.getListUsers] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (search) optionsQuery.where = setSearchQuery(this.models.usrUsers, search, optionsQuery);

    return await paginateModel(this.models.usrUsers, limit, page, optionsQuery);
  }

  async getUserDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[UserServices.getUserDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const user = await this.models.usrUsers.findOne(optionsQuery);

    if (includeHistory) user.dataValues.history = await this.logService.getFullLogsHistory(user);

    return user;
  }

  async updateUser(id, { firstName, secondName, firstLastName, secondLastName, active, userSession, t } = {}) {
    const updateData = { firstName, secondName, firstLastName, secondLastName };

    const user = await this.models.usrUsers.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[UserServices.updateUser] '),
    });

    const oldData = JSON.parse(JSON.stringify(user));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await user.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[UserServices.updateUser] ', updateData),
      });

      if (active !== undefined) await this.updateUsersStatus(userSession, [id], active, { t: t || transaction });

      if (userSession && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(userSession, this.models.usrUsers, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteUser(id, { justification, userSession, t } = {}) {
    const user = await this.models.usrUsers.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[UserServices.deleteUser]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await user.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[UserServices.deleteUser]'),
      });

      if (userSession) {
        await this.logService.recordDeletionLog(userSession, this.models.usrUsers, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = UserServices;
