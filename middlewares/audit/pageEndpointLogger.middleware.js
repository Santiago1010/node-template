const ContextHelper = require('../../helpers/context.helper');
const { initializeConnection } = require('../../config/database/connection');

const locations = ['body', 'params', 'query', 'header'];

const pageUseEndpoint = async (req, _, next) => {
  const page = ContextHelper.get('page');
  const endpoint = ContextHelper.get('endpoint');

  try {
    const sequelize = await initializeConnection();
    const { configPagesHasEndpoints, configPagesEndpointsHasSchemas } = sequelize.models;

    await sequelize.transaction(async (transaction) => {
      let pageHasEndpoint = await configPagesHasEndpoints.findOne({
        where: { pageId: page.id, endpointId: endpoint.id },
        paranoid: false,
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
          console.log(field);
        }
      }
    });

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { pageUseEndpoint };
