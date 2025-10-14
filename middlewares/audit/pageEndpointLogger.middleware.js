const ContextHelper = require('../../helpers/context.helper');
const { initializeConnection } = require('../../config/database/connection');

const pageUseEndpoint = async (_, __, next) => {
  const page = ContextHelper.get('page');
  const endpoint = ContextHelper.get('endpoint');

  try {
    const sequelize = await initializeConnection();
    const { configPagesHasEndpoints } = sequelize.models;

    const pageHasEndpoint = await configPagesHasEndpoints.findOne({
      where: { pageId: page.id, endpointId: endpoint.id },
      paranoid: false,
    });

    if (!pageHasEndpoint) {
      await configPagesHasEndpoints.create({ pageId: page.id, endpointId: endpoint.id });
    } else {
      await pageHasEndpoint.restore();
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { pageUseEndpoint };
