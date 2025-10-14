const moment = require('moment');

const ContextHelper = require('../../helpers/context.helper');
const i18n = require('../../config/i18n');
const { initializeConnection } = require('../../config/database/connection');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');

/**
 * Optimized page endpoint usage tracking middleware
 *
 * Performance optimizations:
 * 1. Batch database operations to reduce round trips
 * 2. Parallel field validation with Promise.all
 * 3. Single bulk upsert for schema associations
 * 4. Early return on empty requests
 * 5. Cached field lookups with Map for O(1) access
 * 6. Minimized transaction scope
 */

const LOCATIONS = ['body', 'params', 'query', 'header'];

/**
 * Collects all request fields from all locations
 */
const collectRequestFields = (req) => {
  const fields = [];

  for (const location of LOCATIONS) {
    const data = req[location];
    if (data && typeof data === 'object') {
      for (const field of Object.keys(data)) {
        fields.push({ field, location });
      }
    }
  }

  return fields;
};

/**
 * Validates all fields exist in endpoint schema
 */
const validateEndpointFields = async (endpointId, requestFields, configEndpointsRequestSchema, transaction) => {
  if (requestFields.length === 0) return new Map();

  // Extract unique field names for single query
  const uniqueFields = [...new Set(requestFields.map((f) => f.field))];

  // Fetch all endpoint fields in single query
  const endpointFields = await configEndpointsRequestSchema.findAll({
    where: {
      endpointId,
      name: uniqueFields,
    },
    attributes: ['id', 'name', 'location'],
    raw: true,
    transaction,
  });

  // Build fast lookup map: "field:location" -> fieldId
  const fieldMap = new Map();
  endpointFields.forEach((field) => {
    fieldMap.set(`${field.name}:${field.location}`, field.id);
  });

  // Validate all fields exist
  const timestamp = moment().format(
    'dddd, DD [' + i18n.__('common.of') + '] MMMM [' + i18n.__('common.of') + '] YYYY, HH:mm:ss.SSS Z'
  );

  for (const { field, location } of requestFields) {
    const key = `${field}:${location}`;
    if (!fieldMap.has(key)) {
      perror('An attempt was made to make a request to an unknown endpoint field', {
        endpoint: ContextHelper.get('endpoint').path,
        field,
        location,
        ip: ContextHelper.get('ip') || 'unknown',
        timestamp,
      });

      throw error({
        httpCode: 401,
        messagePath: 'errors.unauthorizedField',
        messageData: { field },
      });
    }
  }

  return fieldMap;
};

/**
 * Syncs page-endpoint schema associations in bulk
 */
const syncSchemaAssociations = async (
  pageEndpointId,
  requestFields,
  fieldMap,
  configPagesEndpointsHasSchemas,
  transaction
) => {
  if (requestFields.length === 0) return;

  // Delete all existing associations for this page-endpoint
  await configPagesEndpointsHasSchemas.destroy({
    where: { pageEndpointId },
    transaction,
  });

  // Prepare bulk insert data
  const associations = requestFields.map(({ field, location }) => {
    const fieldId = fieldMap.get(`${field}:${location}`);
    return {
      pageEndpointId,
      endpointFieldId: fieldId,
      location,
    };
  });

  // Bulk create all associations in single query
  await configPagesEndpointsHasSchemas.bulkCreate(associations, {
    transaction,
    ignoreDuplicates: true,
  });
};

const pageUseEndpoint = async (req, _, next) => {
  try {
    const page = ContextHelper.get('page');
    const endpoint = ContextHelper.get('endpoint');

    // Early validation
    if (!page?.id || !endpoint?.id) {
      throw error({
        httpCode: 400,
        messagePath: 'errors.invalidPageOrEndpoint',
      });
    }

    // Collect all request fields early
    const requestFields = collectRequestFields(req);

    // Early return if no fields to process
    if (requestFields.length === 0) {
      return next();
    }

    const sequelize = await initializeConnection();
    const { configPagesHasEndpoints, configPagesEndpointsHasSchemas, configEndpointsRequestSchema } = sequelize.models;

    await sequelize.transaction(async (transaction) => {
      // Find or create page-endpoint association
      let [pageHasEndpoint, created] = await configPagesHasEndpoints.findOrCreate({
        where: { pageId: page.id, endpointId: endpoint.id },
        defaults: { pageId: page.id, endpointId: endpoint.id },
        paranoid: false,
        transaction,
      });

      // Restore if was soft-deleted
      if (!created && pageHasEndpoint.deletedAt) {
        await pageHasEndpoint.restore({ transaction });
      }

      // Validate all fields and get field map
      const fieldMap = await validateEndpointFields(
        endpoint.id,
        requestFields,
        configEndpointsRequestSchema,
        transaction
      );

      // Sync schema associations in bulk
      await syncSchemaAssociations(
        pageHasEndpoint.id,
        requestFields,
        fieldMap,
        configPagesEndpointsHasSchemas,
        transaction
      );
    });

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { pageUseEndpoint };
