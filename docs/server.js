const config = require('../config/env');

module.exports = {
  servers: [
    {
      url: config.url + '/api/v1',
      description: 'Version 1',
    },
  ],
};
