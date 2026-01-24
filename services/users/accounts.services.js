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
const { formatPhone } = require('../../utils/strings.util');

class AccountServices {
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
  async createAccount(
    userId,
    rolId,
    password,
    { dialCodeId, recoveryEmail, recoveryEmailConfirmedAt, twoFactorEnabled, user, t } = {}
  ) {
    const createData = {
      userId,
      rolId,
      dialCodeId,
      recoveryEmail,
      recoveryEmailConfirmedAt,
      password,
      twoFactorEnabled,
    };

    return await this.sequelize.transaction(async (transaction) => {
      const account = await this.models.usrAccounts.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[AccountServices.createAccount] ', createData),
      });

      if (user) {
        await this.logService.recordCreationLog(user, this.models.usrAccounts, account, {
          transaction: t || transaction,
        });
      }

      return account;
    });
  }

  async updateAccountsStatus(ids, active, { user, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.usrAccounts, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[AccountServices.updateAccountsStatus]'),
      });

      if (user) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(user, this.models.usrAccounts, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListAccounts({ limit, page, search, ids = [], fields = [], active, userId, rolId, dialCodeId } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: usrUsers, as: 'usrusers' }
        // { model: configRoles, as: 'configroles' }
        // { model: geoDialCodes, as: 'geodialcodes' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[AccountServices.getListAccounts] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (userId) optionsQuery.where.userId = userId;
    if (rolId) optionsQuery.where.rolId = rolId;
    if (dialCodeId) optionsQuery.where.dialCodeId = dialCodeId;

    if (search) optionsQuery.where = setSearchQuery(this.models.usrAccounts, search, optionsQuery);

    return await paginateModel(this.models.usrAccounts, limit, page, optionsQuery);
  }

  async getAccountDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // { model: usrUsers, as: 'usrusers' }
        // { model: configRoles, as: 'configroles' }
        // { model: geoDialCodes, as: 'geodialcodes' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[AccountServices.getAccountDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const account = await this.models.usrAccounts.findOne(optionsQuery);

    if (includeHistory) account.dataValues.history = await this.logService.getFullLogsHistory(account);

    return account;
  }

  async getAccount({
    fields = [],
    userId,
    rolId,
    targetRol,
    dialCodeId,
    credentialType,
    credentialValue,
    verifiedCredential,
    active,
  } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        {
          model: this.models.usrUsers,
          as: 'user',
          // attributes: [],
          required: true,
        },
        {
          model: this.models.configRoles,
          as: 'rol',
          attributes: ['id', 'name', 'target', 'targetInt'],
          where: {},
          required: true,
          include: {
            model: this.models.configSecurityLevels,
            as: 'securityLevel',
            attributes: ['id', 'slug', 'name', 'priority', 'description'],
            required: true,
          },
        },
        {
          model: this.models.usrCredentials,
          as: 'credentials',
          attributes: ['id', 'credentialType', 'credentialtypeInt', 'credentialValue', 'verifiedAt'],
          where: {},
          required: true,
          separate: true,
        },
        {
          model: this.models.geoDialCodes,
          as: 'dialCode',
          required: false,
        },
      ],
      subQuery: false,
      logging: wrapLogging('[AccountServices.getAccount] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (userId) optionsQuery.where.userId = userId;

    if (rolId) optionsQuery.where.rolId = rolId;

    if (targetRol) optionsQuery.where.rol.target = targetRol;

    if (dialCodeId) optionsQuery.where.dialCodeId = dialCodeId;

    if (credentialType) optionsQuery.include[2].where.credentialType = credentialType;

    if (credentialValue) optionsQuery.include[2].where.credentialValue = credentialValue;

    if (verifiedCredential !== undefined) {
      optionsQuery.where.credentials.verifiedAt = verifiedCredential ? { [Op.not]: null } : null;
    }

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    const account = await this.models.usrAccounts.findOne(optionsQuery);

    if (!account) return null;

    for (const credential of account.credentials) {
      if (credential.credentialtypeInt === 2 && account.dialCode?.mask) {
        const formattedNumber = formatPhone(account.dialCode.mask, account.dialCode.code, credential.credentialValue);

        if (formattedNumber) credential.dataValues.formattedNumber = formattedNumber;
        credential.dataValues.credentialValue = account.dialCode.code + credential.credentialValue;
      }
    }

    return account;
  }

  async updateAccount(
    id,
    {
      userId,
      rolId,
      dialCodeId,
      recoveryEmail,
      recoveryEmailConfirmedAt,
      password,
      twoFactorEnabled,
      active,
      user,
      t,
    } = {}
  ) {
    const updateData = {
      userId,
      rolId,
      dialCodeId,
      recoveryEmail,
      recoveryEmailConfirmedAt,
      password,
      twoFactorEnabled,
    };

    const account = await this.models.usrAccounts.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccountServices.updateAccount] '),
    });

    const oldData = JSON.parse(JSON.stringify(account));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await account.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[AccountServices.updateAccount] ', updateData),
      });

      if (active !== undefined) await this.updateAccountsStatus(user, [id], active, { t: t || transaction });

      if (user && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(user, this.models.usrAccounts, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteAccount(id, { justification, user, t } = {}) {
    const account = await this.models.usrAccounts.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[AccountServices.deleteAccount]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await account.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[AccountServices.deleteAccount]'),
      });

      if (user) {
        await this.logService.recordDeletionLog(user, this.models.usrAccounts, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = AccountServices;
