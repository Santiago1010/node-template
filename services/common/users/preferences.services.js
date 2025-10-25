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

class PreferenceServices {
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
  async createPreference(accountId, languageId, timezoneId, { theme, whatsapp, sms, email, user, t } = {}) {
    const createData = { accountId, languageId, timezoneId, theme, whatsapp, sms, email };

    return await this.sequelize.transaction(async (transaction) => {
      const preference = await this.models.usrPreferences.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[PreferenceServices.createPreference] ', createData),
      });

      if (user) {
        await this.logService.recordCreationLog(user, this.models.usrPreferences, preference, {
          transaction: t || transaction,
        });
      }

      return preference;
    });
  }

  async updatePreferencesStatus(ids, active, { user, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.usrPreferences, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[PreferenceServices.updatePreferencesStatus]'),
      });

      if (user) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(user, this.models.usrPreferences, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListPreferences({
    limit,
    page,
    search,
    ids = [],
    fields = [],
    active,
    accountId,
    languageId,
    timezoneId,
    theme,
  } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
        // { model: dataLanguages, as: 'datalanguages' }
        // { model: dataTimezones, as: 'datatimezones' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[PreferenceServices.getListPreferences] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (accountId) optionsQuery.where.accountId = accountId;
    if (languageId) optionsQuery.where.languageId = languageId;
    if (timezoneId) optionsQuery.where.timezoneId = timezoneId;
    if (theme) optionsQuery.where.theme = theme;

    if (search) optionsQuery.where = setSearchQuery(this.models.usrPreferences, search, optionsQuery);

    return await paginateModel(this.models.usrPreferences, limit, page, optionsQuery);
  }

  async getPreferenceDetails(identifier, { fields = [], includeHistory = false } = {}) {
    const optionsQuery = {
      where: { [Op.or]: [{ id: identifier }] },
      include: [
        // { model: usrAccounts, as: 'usraccounts' }
        // { model: dataLanguages, as: 'datalanguages' }
        // { model: dataTimezones, as: 'datatimezones' }
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[PreferenceServices.getPreferenceDetails] '),
    };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    const preference = await this.models.usrPreferences.findOne(optionsQuery);

    if (includeHistory) preference.dataValues.history = await this.logService.getFullLogsHistory(preference);

    return preference;
  }

  async updatePreference(id, { accountId, languageId, timezoneId, theme, whatsapp, sms, email, active, user, t } = {}) {
    const updateData = { accountId, languageId, timezoneId, theme, whatsapp, sms, email };

    const preference = await this.models.usrPreferences.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[PreferenceServices.updatePreference] '),
    });

    const oldData = JSON.parse(JSON.stringify(preference));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await preference.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[PreferenceServices.updatePreference] ', updateData),
      });

      if (active !== undefined) await this.updatePreferencesStatus(user, [id], active, { t: t || transaction });

      if (user && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(user, this.models.usrPreferences, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deletePreference(id, { justification, user, t } = {}) {
    const preference = await this.models.usrPreferences.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[PreferenceServices.deletePreference]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await preference.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[PreferenceServices.deletePreference]'),
      });

      if (user) {
        await this.logService.recordDeletionLog(user, this.models.usrPreferences, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = PreferenceServices;
