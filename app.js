// =============================================================================
// NODE DEPENDENCIES
// =============================================================================
const fs = require('fs');
const path = require('path');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const chalk = require('chalk');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const moment = require('moment-timezone');
const morgan = require('morgan');
const Boom = require('@hapi/boom');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const config = require('./config/env');
const i18n = require('./config/i18n');
const getHelmetConfiguration = require('./config/security/helmet.config');
const errorHandler = require('./middlewares/errorHandler.middleware');
const routerApi = require('./routes');
const HostsService = require('./services/web/config/env/hosts');
const { generalLimiter, rateLimitHeaders } = require('./config/security/limit.config');
const { root } = require('./helpers/constants.helper');
const { checkDevelopmentMode } = require('./helpers/debug.helper');
const { createSecureMiddleware } = require('./middlewares/customSanitizer.middleware');

// =============================================================================
// INITIAL SETUP
// =============================================================================
moment.tz.setDefault(config.timeZone);
moment.locale(config.lang);

const app = express();

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================
app.use(compression({ level: 1 }));
app.set('views', path.join(root, 'views'));
app.set('view engine', 'ejs');

app.use(helmet(getHelmetConfiguration()));

app.use(generalLimiter);
app.use(rateLimitHeaders);

const corsOptions = {
  origin: async (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = await HostsService.getWhiteList();

    callback(
      allowedOrigins.includes(origin) ? null : new Error('Not allowed by CORS'),
      allowedOrigins.includes(origin)
    );
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Path'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors());
app.use(cookieParser(config.cookieSecret));

app.use((_, res, next) => {
  res.cookieDefaults = {
    secure: !checkDevelopmentMode(),
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 3600000,
  };
  next();
});

app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(...createSecureMiddleware({ deepSanitization: true }));
app.use(cookieParser());
app.use(express.static(path.join(root, 'public')));

// --------------------------- MORGAN CONFIGURATION ------------------------- //
morgan.token('date', () => moment().format('DD/MM/YYYY, HH:mm:ss'));

morgan.token('statusColor', (_, res) => {
  const status = res.statusCode;

  if (status >= 500) return chalk.red(status);
  if (status >= 400) return chalk.yellow(status);
  if (status >= 300) return chalk.cyan(status);
  if (status >= 200) return chalk.green(status);

  return status;
});

morgan.token('coloredMethod', (req) => {
  switch (req.method) {
    case 'GET':
      return chalk.hex('#3498db')(req.method);
    case 'POST':
      return chalk.hex('#2ecc71')(req.method);
    case 'PUT':
      return chalk.hex('#f1c40f')(req.method);
    case 'DELETE':
      return chalk.hex('#e74c3c')(req.method);
    case 'PATCH':
      return chalk.hex('#9b59b6')(req.method);
    default:
      return req.method;
  }
});

morgan.token('coloredResponseTime', (req, res) => {
  if (!req._startAt || !res._startAt) return '0';

  const sec = res._startAt[0] - req._startAt[0];
  const nano = res._startAt[1] - req._startAt[1];
  const ms = sec * 1e3 + nano / 1e6;
  const time = ms.toFixed(0);

  if (ms <= 400) return chalk.green(time);
  if (ms <= 800) return chalk.blue(time);
  if (ms <= 1200) return chalk.hex('#f39c12')(time);

  return chalk.red(time);
});

const coloredFormat = ':coloredMethod :url :statusColor :coloredResponseTime ms - :date';
const fileFormat = ':method :url :status :response-time ms - :date';

if (!checkDevelopmentMode(true)) {
  app.use(morgan(coloredFormat));
  app.use(
    morgan(fileFormat, {
      stream: fs.createWriteStream(path.join(__dirname, '/logs/access.log'), { flags: 'a' }),
      skip: (_, res) => res.statusCode >= 400,
    })
  );
} else {
  app.use(morgan(coloredFormat));
}

// ---------------------------- ROUTE HANDLERS ------------------------------ //
app.get('/health', (_, res) => res.status(200).render('main/health'));

app.use((_, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  });
  next();
});

// Apply specialized rate limiters to specific routes in your routerApi
// You'll need to modify your routerApi to use the appropriate limiters
routerApi(app);

// --------------------------- ERROR HANDLING ------------------------------ //
app.use((_, __, next) => next(Boom.notFound(i18n.__('errors.path.404'))));
app.use(errorHandler.logErrorWithContext);
app.use(errorHandler.ormErrorHandler);
app.use(errorHandler.boomErrorHandler);

module.exports = app;
