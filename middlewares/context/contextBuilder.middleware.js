const moment = require('moment');

const i18n = require('../../config/i18n');
const ContextHelper = require('../../helpers/context.helper');
const { initializeConnection } = require('../../config/database/connection');
const { perror } = require('../../helpers/debug.helper');
const { error } = require('../../helpers/response.helper');

const setHost = (enviroment) => async (req, _, next) => {
  const fullHost = req.protocol + '://' + req.get('host');

  try {
    const sequelize = await initializeConnection();
    const { configHosts } = sequelize.models;

    let host = await configHosts.findOne({ attributes: ['id', 'url'], where: { url: fullHost }, raw: true });

    if (!host) {
      perror('An attempt was made to make a request from an unknown host', {
        host: fullHost,
        ip: req.ip,
        timestamp: moment().format(
          'dddd, DD [' + i18n.__('common.of') + '] MMMM [' + i18n.__('common.of') + '] YYYY, HH:mm:ss.SSS Z'
        ),
      });

      throw error({ httpCode: 401, messagePath: 'errors.unauthorized' });
    }

    ContextHelper.run({ enviroment, host }, () => {
      next();
    });
  } catch (error) {
    return next(error);
  }
};

const setPage = async (req, _, next) => {
  const headerPage = JSON.parse(req.headers['x-path']);

  try {
    const sequelize = await initializeConnection();
    const { configPages } = sequelize.models;

    const host = ContextHelper.get('host');

    let page = await configPages.findOne({
      attributes: ['id', 'name', 'path', 'level'],
      where: { hostId: host.id, name: headerPage.name, path: headerPage.path },
      raw: true,
    });

    if (!page) {
      perror('An attempt was made to make a request from an unknown page', {
        host,
        page: headerPage,
        ip: req.ip,
        timestamp: moment().format(
          'dddd, DD [' + i18n.__('common.of') + '] MMMM [' + i18n.__('common.of') + '] YYYY, HH:mm:ss.SSS Z'
        ),
      });

      throw error({ httpCode: 401, messagePath: 'errors.unauthorized' });
    }

    ContextHelper.set('page', page);

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { setHost, setPage };
