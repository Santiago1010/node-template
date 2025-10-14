const moment = require('moment');

const i18n = require('../../config/i18n');
const ContextHelper = require('../../helpers/context.helper');
const { initializeConnection } = require('../../config/database/connection');
const { error } = require('../../helpers/response.helper');
const { perror } = require('../../helpers/debug.helper');

const setHost = async (req, _, next) => {
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

    return ContextHelper.run({ host }, () => next());
  } catch (error) {
    return next(error);
  }
};

module.exports = { setHost };
