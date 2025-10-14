// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const express = require('express');
const userAgent = require('express-useragent');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const docs = require('../docs');
const { isDevelopmentMode } = require('../helpers/debug.helper');
const { setEnvironment } = require('../middlewares/context/contextBuilder.middleware');

// =============================================================================
// ROUTER API
// =============================================================================
const routerApi = (app) => {
  app.use(userAgent.express());

  const routerBase = express.Router();
  const routerAppV1 = express.Router();
  const routerBotV1 = express.Router();
  const routerDesktopV1 = express.Router();
  const routerWearableV1 = express.Router();
  const routerWebV1 = express.Router();

  if (isDevelopmentMode(true)) {
    const swaggerUI = require('swagger-ui-express');

    routerBase.use('/docs', swaggerUI.serve, swaggerUI.setup(docs, { swaggerOptions: { docExpansion: 'none' } }));
  }

  routerWebV1.use(require('./web'));

  app.use('/api', routerBase);
  app.use('/api/app/v1', setEnvironment('app'), routerAppV1);
  app.use('/api/bot/v1', setEnvironment('bot'), routerBotV1);
  app.use('/api/desktop/v1', setEnvironment('desktop'), routerDesktopV1);
  app.use('/api/wearable/v1', setEnvironment('wearable'), routerWearableV1);
  app.use('/api/web/v1', setEnvironment('web'), routerWebV1);
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = routerApi;
