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

class EndpointServices {
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
  async createEndpoint(
    method,
    version,
    endpointGroup,
    path,
    { description, requiresAuthorization, hasSensitiveInformation, actor, t } = {}
  ) {
    const createData = {
      method,
      version,
      endpointGroup,
      path,
      description,
      requiresAuthorization,
      hasSensitiveInformation,
    };

    return await this.sequelize.transaction(async (transaction) => {
      const endpoint = await this.models.configEndpoints.create(createData, {
        transaction: t || transaction,
        logging: wrapLogging('[EndpointServices.createEndpoint] ', createData),
      });

      if (actor) {
        await this.logService.recordCreationLog(actor, this.models.configEndpoints, endpoint, {
          transaction: t || transaction,
        });
      }

      return endpoint;
    });
  }

  async updateEndpointsStatus(ids, active, { actor, t } = {}) {
    return await this.sequelize.transaction(async (transaction) => {
      const result = await bulkToggleSoftDelete(this.models.configEndpoints, { id: { [Op.in]: ids } }, active, {
        transaction: t || transaction,
        logging: wrapLogging('[EndpointServices.updateEndpointsStatus]'),
      });

      if (actor) {
        const logsPromises = ids.map(async (id) => {
          return await this.logService.recordStatusChangeLog(actor, this.models.configEndpoints, id, active, {
            transaction: t || transaction,
          });
        });

        await Promise.all(logsPromises);
      }

      return result;
    });
  }

  async getListEndpoints({
    limit,
    page,
    search,
    ids = [],
    fields = [],
    active,
    method,
    requiresAuthorization,
    hasSensitiveInformation,
  } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[EndpointServices.getListEndpoints] '),
    };

    if (ids && ids.length > 0) optionsQuery.where.id = { [Op.in]: ids };

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (method !== undefined) optionsQuery.where.method = method;

    if (requiresAuthorization !== undefined) optionsQuery.where.requiresAuthorization = requiresAuthorization;

    if (hasSensitiveInformation !== undefined) optionsQuery.where.hasSensitiveInformation = hasSensitiveInformation;

    if (search) optionsQuery.where = setSearchQuery(this.models.configEndpoints, search, optionsQuery);

    return await paginateModel(this.models.configEndpoints, limit, page, optionsQuery);
  }

  async getEndpointDetails({
    id,
    search,
    fields = [],
    active,
    method,
    requiresAuthorization,
    hasSensitiveInformation,
    includeHistory = false,
  } = {}) {
    const optionsQuery = {
      where: {},
      include: [
        // Add your model includes here
      ],
      paranoid: false,
      subQuery: false,
      logging: wrapLogging('[EndpointServices.getEndpointDetails] '),
    };

    if (id) optionsQuery.where.id = id;

    if (fields && fields.length > 0) optionsQuery.attributes = fields;

    if (active !== undefined) optionsQuery.where.deletedAt = active ? null : { [Op.not]: null };

    if (method !== undefined) optionsQuery.where.method = method;

    if (requiresAuthorization !== undefined) optionsQuery.where.requiresAuthorization = requiresAuthorization;

    if (hasSensitiveInformation !== undefined) optionsQuery.where.hasSensitiveInformation = hasSensitiveInformation;

    if (search) optionsQuery.where = setSearchQuery(this.models.configEndpoints, search, optionsQuery);

    const endpoint = await this.models.configEndpoints.findOne(optionsQuery);

    if (includeHistory && endpoint) endpoint.dataValues.history = await this.logService.getFullLogsHistory(endpoint);

    return endpoint;
  }

  async updateEndpoint(
    id,
    {
      method,
      version,
      endpointGroup,
      path,
      description,
      requiresAuthorization,
      hasSensitiveInformation,
      active,
      actor,
      t,
    } = {}
  ) {
    const updateData = {
      method,
      version,
      endpointGroup,
      path,
      description,
      requiresAuthorization,
      hasSensitiveInformation,
    };

    const endpoint = await this.models.configEndpoints.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[EndpointServices.updateEndpoint] '),
    });

    const oldData = JSON.parse(JSON.stringify(endpoint));

    return await this.sequelize.transaction(async (transaction) => {
      const updatedData = await endpoint.update(updateData, {
        transaction: t || transaction,
        logging: wrapLogging('[EndpointServices.updateEndpoint] ', updateData),
      });

      if (active !== undefined) await this.updateEndpointsStatus([id], active, { actor, t: t || transaction });

      if (actor && Object.values(updateData).some((value) => value !== undefined)) {
        await this.logService.recordUpdateLog(actor, this.models.configEndpoints, oldData, updatedData, {
          transaction: t || transaction,
        });
      }

      return updatedData;
    });
  }

  async deleteEndpoint(id, { justification, actor, t } = {}) {
    const endpoint = await this.models.configEndpoints.findByPk(id, {
      paranoid: false,
      logging: wrapLogging('[EndpointServices.deleteEndpoint]'),
    });

    return await this.sequelize.transaction(async (transaction) => {
      const deletedData = await endpoint.destroy({
        force: true,
        transaction: t || transaction,
        logging: wrapLogging('[EndpointServices.deleteEndpoint]'),
      });

      if (actor) {
        await this.logService.recordDeletionLog(actor, this.models.configEndpoints, deletedData, {
          justification,
          transaction: t || transaction,
        });
      }

      return deletedData;
    });
  }
}

module.exports = EndpointServices;
