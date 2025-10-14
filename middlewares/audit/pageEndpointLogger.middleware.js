const moment = require('moment');

const ContextHelper = require('../../helpers/context.helper');
const i18n = require('../../config/i18n');
const { initializeConnection } = require('../../config/database/connection');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');

const locations = ['body', 'params', 'query', 'header'];

const pageUseEndpoint = async (req, _, next) => {
  const page = ContextHelper.get('page');
  const endpoint = ContextHelper.get('endpoint');

  try {
    const sequelize = await initializeConnection();
    const { configPagesHasEndpoints, configPagesEndpointsHasSchemas, configEndpointsRequestSchema } = sequelize.models;

    await sequelize.transaction(async (transaction) => {
      let pageHasEndpoint = await configPagesHasEndpoints.findOne({
        where: { pageId: page.id, endpointId: endpoint.id },
        paranoid: false,
        transaction,
      });

      if (!pageHasEndpoint) {
        pageHasEndpoint = await configPagesHasEndpoints.create(
          { pageId: page.id, endpointId: endpoint.id },
          { transaction }
        );
      } else {
        pageHasEndpoint = await pageHasEndpoint.restore({ transaction });
      }

      await configPagesEndpointsHasSchemas.destroy({ where: { pageEndpointId: pageHasEndpoint.id }, transaction });

      for (const location of locations) {
        for (const field of Object.keys(req[location])) {
          const endpointField = await configEndpointsRequestSchema.findOne({
            where: { endpointId: endpoint.id, name: field, location },
            transaction,
          });

          if (!endpointField) {
            perror('An attempt was made to make a request to an unknown endpoint field', {
              endpoint: endpoint.path,
              field,
              location,
              ip: req.ip,
              timestamp: moment().format(
                'dddd, DD [' + i18n.__('common.of') + '] MMMM [' + i18n.__('common.of') + '] YYYY, HH:mm:ss.SSS Z'
              ),
            });

            throw error({ httpCode: 401, messagePath: 'errors.unauthorizedField', messageData: { field } });
          }

          const pageEndpointRequestSchema = await configPagesEndpointsHasSchemas.findOne({
            where: { pageEndpointId: pageHasEndpoint.id, endpointFieldId: endpointField.id },
            paranoid: false,
            transaction,
          });

          if (!pageEndpointRequestSchema) {
            await configPagesEndpointsHasSchemas.create(
              { pageEndpointId: pageHasEndpoint.id, endpointFieldId: endpointField.id, location },
              { transaction }
            );
          } else {
            await pageEndpointRequestSchema.update({ location }, { transaction });

            await pageEndpointRequestSchema.restore({ transaction });
          }
        }
      }
    });

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { pageUseEndpoint };
