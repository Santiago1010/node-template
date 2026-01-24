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

class CredentialServices {
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
  async createCredential(accountId, credentialType, credentialValue, { verifiedAt, user, t } = {}) {
    const createData = { accountId, credentialType, credentialValue, verifiedAt };

    return await this.sequelize.transaction(async (transaction) => {
      const credential = await this.models.usrCredentials.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[CredentialServices.createCredential] ', createData),
      });

      if (user) {
        await this.logService.recordCreationLog(user, this.models.usrCredentials, credential, {
          transaction: t || transaction,
        });
      }

      return credential;
    });
  }

  async updateCredentialsStatus(ids, active, { user, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.usrCredentials, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[CredentialServices.updateCredentialsStatus]'),
      });

      if (user) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(user, this.models.usrCredentials, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListCredentials({ limit, page, search, ids = [], fields = [], active, accountId, credentialType } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CredentialServices.getListCredentials] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (accountId) optionsQuery.where.accountId = accountId;
    if (credentialType) optionsQuery.where.credentialType = credentialType;

    if (search) optionsQuery.where = setSearchQuery(this.models.usrCredentials, search, optionsQuery);

    return await paginateModel(this.models.usrCredentials, limit, page, optionsQuery);
  }

  async getCredentialDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[CredentialServices.getCredentialDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const credential = await this.models.usrCredentials.findOne(optionsQuery);

    if (includeHistory) credential.dataValues.history = await this.logService.getFullLogsHistory(credential);

    return credential;
  }

  async updateCredential(id, { accountId, credentialType, credentialValue, verifiedAt, active, user, t } = {}) {
    const updateData = { accountId, credentialType, credentialValue, verifiedAt };

    const credential = await this.models.usrCredentials.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CredentialServices.updateCredential] '),
    });

    const oldData = JSON.parse(JSON.stringify(credential));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await credential.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[CredentialServices.updateCredential] ', updateData),
      });

      if (active !== undefined) await this.updateCredentialsStatus(user, [id], active, { t: t || transaction });

      if (user && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(user, this.models.usrCredentials, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteCredential(id, { justification, user, t } = {}) {
    const credential = await this.models.usrCredentials.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[CredentialServices.deleteCredential]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await credential.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[CredentialServices.deleteCredential]'),
      });

      if (user) {
        await this.logService.recordDeletionLog(user, this.models.usrCredentials, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = CredentialServices;
