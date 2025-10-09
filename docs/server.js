const config = require('../config/env');

module.exports = {
  servers: [
    {
      url: config.url + '/api/web/v1',
      description: 'Version 1 - Web Platform Endpoints',
    },
    {
      url: config.url + '/api/app/v1',
      description: 'Version 1 - Mobile App Endpoints',
    },
  ],
};
