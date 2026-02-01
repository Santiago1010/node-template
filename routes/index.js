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
const { pageUseEndpoint } = require('../middlewares/audit/pageEndpointLogger.middleware');
const { setHost, setPage, setEndpoint } = require('../middlewares/context/contextBuilder.middleware');

// =============================================================================
// ROUTER API
// =============================================================================
const routerApi = (app) => {
  app.use(userAgent.express());

  const routerBase = express.Router();
  const routerApiV1 = express.Router();

  if (isDevelopmentMode(true)) {
    const swaggerUI = require('swagger-ui-express');

    routerBase.use('/docs', swaggerUI.serve, swaggerUI.setup(docs, { swaggerOptions: { docExpansion: 'none' } }));
  }

  routerApiV1.use(setHost);
  routerApiV1.use(setPage);
  routerApiV1.use(setEndpoint);

  routerApiV1.use(pageUseEndpoint);

  routerApiV1.use('/auth', require('./auth'));
  routerApiV1.use('/security', require('./security'));

  app.use('/api', routerBase);
  app.use('/api/v1', routerApiV1);
};

// =============================================================================
// MODULE EXPORTS)
// =============================================================================
module.exports = routerApi;
