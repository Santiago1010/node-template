// =============================================================================
// NODE DEPENDENCIES
// =============================================================================
const path = require('path');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const compression = require('compression');
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');
const moment = require('moment-timezone');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const config = require('./config/env');
const getHelmetConfiguration = require('./config/security/helmet.config');
const {
  deviceAwareCookieMiddleware,
  authStrategyMiddleware,
  setDeviceAwareSecurityHeaders,
} = require('./config/security/cookies.config');
const { corsMiddleware } = require('./config/security/cors.config');
const { generalLimiter, rateLimitHeaders } = require('./config/security/rate-limit.config');
const { morgan, coloredFormat, fileFormat, stream } = require('./config/tools/morgan.config');
const { ROOT } = require('./helpers/constants.helper');
const { requestLogger } = require('./middlewares/errors/requestLogger.middleware');
const { notFoundHandler } = require('./middlewares/errors/notFound.helper');
const errorHandler = require('./middlewares/errors/errorHandler.middleware');

moment.tz.setDefault(config.timeZone);
moment.locale(config.lang);

const app = express();

app.use(compression({ level: 1 }));
app.set('views', path.join(ROOT, 'views'));
app.set('view engine', 'ejs');

app.use(helmet(getHelmetConfiguration()));

app.use(generalLimiter);
app.use(rateLimitHeaders);

app.use(corsMiddleware);

app.use(cookieParser(config.cookieSecret));

app.use(deviceAwareCookieMiddleware);
app.use(authStrategyMiddleware);
app.use(setDeviceAwareSecurityHeaders);

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(express.static(path.join(ROOT, 'public')));

app.use(morgan(coloredFormat));
app.use(morgan(fileFormat, { stream: stream, skip: (_, res) => res.statusCode >= 400 }));

app.use(requestLogger());

// API Routes

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
