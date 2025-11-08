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
const { error } = require('../../helpers/response.helper');

class TokenServices {
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
  async createToken(accountId, token, purpose, expiresIn, { usedAt, user, t } = {}) {
    const createData = { accountId, token, purpose, expiresIn, usedAt };

    return await this.sequelize.transaction(async (transaction) => {
      await this.destroyPreviousTokensNotUsed(accountId, purpose, { t: t || transaction });

      const token = await this.models.usrTokens.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[TokenServices.createToken] ', createData),
      });

      if (user) {
        await this.logService.recordCreationLog(user, this.models.usrTokens, token, {
          transaction: t || transaction,
        });
      }

      return token;
    });
  }

  async updateTokensStatus(ids, active, { user, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.usrTokens, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[TokenServices.updateTokensStatus]'),
      });

      if (user) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(user, this.models.usrTokens, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListTokens({ limit, page, search, ids = [], fields = [], active, accountId, purpose } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[TokenServices.getListTokens] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (accountId) optionsQuery.where.accountId = accountId;
    if (purpose) optionsQuery.where.purpose = purpose;

    if (search) optionsQuery.where = setSearchQuery(this.models.usrTokens, search, optionsQuery);

    return await paginateModel(this.models.usrTokens, limit, page, optionsQuery);
  }

  async getTokenDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[TokenServices.getTokenDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const token = await this.models.usrTokens.findOne(optionsQuery);

    if (includeHistory) token.dataValues.history = await this.logService.getFullLogsHistory(token);

    return token;
  }

  async updateToken(id, { accountId, token, purpose, expiresIn, usedAt, active, user, t } = {}) {
    const updateData = { accountId, token, purpose, expiresIn, usedAt };

    const tokenDb = await this.models.usrTokens.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[TokenServices.updateToken] '),
    });

    const oldData = JSON.parse(JSON.stringify(tokenDb));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await tokenDb.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[TokenServices.updateToken] ', updateData),
      });

      if (active !== undefined) await this.updateTokensStatus(user, [id], active, { t: t || transaction });

      if (user && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(user, this.models.usrTokens, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteToken(id, { justification, user, t } = {}) {
    const token = await this.models.usrTokens.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[TokenServices.deleteToken]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await token.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[TokenServices.deleteToken]'),
      });

      if (user) {
        await this.logService.recordDeletionLog(user, this.models.usrTokens, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }

  // ================================= HELPERS =================================
  async destroyPreviousTokensNotUsed(accountId, purpose, { t }) {
    return await this.models.usrTokens.destroy({
      where: { accountId, purpose, usedAt: null },
      transaction: t,
      logging: wrapLogging('[TokenServices.createToken] Destroy previous tokens not used'),
    });
  }

  async useAToken(accountId, token, purpose, usedAt, { t }) {
    await this.destroyPreviousTokensNotUsed(accountId, purpose, { t });

    const tokenDb = await this.models.usrTokens.findOne({
      where: { accountId, token, purpose, usedAt: null },
      logging: wrapLogging('[TokenServices.useAToken] Get token by token'),
    });

    if (!tokenDb) throw error({ httpCode: 404, messagePath: 'auth.invalidToken' });

    return await tokenDb.update({ usedAt }, { transaction: t });
  }
}

module.exports = TokenServices;
