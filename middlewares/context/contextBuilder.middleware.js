const ContextHelper = require('../../helpers/context.helper');
const { initializeConnection } = require('../../config/database/connection');
const { error } = require('../../helpers/response.helper');

const setHost = async (req, _, next) => {
  const fullHost = req.protocol + '://' + req.get('host');

  try {
    const sequelize = await initializeConnection();
    const { configHosts } = sequelize.models;

    let host = await configHosts.findOne({ attributes: ['id', 'url'], where: { url: fullHost }, raw: true });

    if (!host) throw error({ httpCode: 401, messagePath: 'errors.unauthorized' });

    return ContextHelper.run({ host }, () => next());
  } catch (error) {
    return next(error);
  }
};

module.exports = { setHost };
