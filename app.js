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
const { generalLimiter, rateLimitHeaders } = require('./config/security/limit.config');
const { morgan, coloredFormat, fileFormat, stream } = require('./config/tools/morgan.config');
const { ROOT } = require('./helpers/constants.helper');

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

module.exports = app;
