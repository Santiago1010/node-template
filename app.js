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
const express = require('express');
const helmet = require('helmet');
const moment = require('moment-timezone');
const morgan = require('morgan');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const config = require('./config/env');
const getHelmetConfiguration = require('./config/security/helmet.config');
const { generalLimiter, rateLimitHeaders } = require('./config/security/limit.config');
const { ROOT } = require('./helpers/constants.helper');
const { checkDevelopmentMode } = require('./helpers/debug.helper');
const { createSecureMiddleware } = require('./middlewares/customSanitizer.middleware');

// =============================================================================
// CORS CONFIGURATION (NEW IMPLEMENTATION)
// =============================================================================
const { corsMiddleware } = require('./config/security/cors.config');

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
app.set('views', path.join(ROOT, 'views'));
app.set('view engine', 'ejs');

app.use(helmet(getHelmetConfiguration()));

app.use(generalLimiter);
app.use(rateLimitHeaders);

app.use(corsMiddleware);

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

// =============================================================================
// BODY PARSING AND SANITIZATION
// =============================================================================
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));
app.use(...createSecureMiddleware({ deepSanitization: true }));
app.use(express.static(path.join(ROOT, 'public')));

// =============================================================================
// MORGAN LOGGING CONFIGURATION
// =============================================================================
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

// =============================================================================
// ROUTE HANDLERS
// =============================================================================
app.get('/health', (_, res) => res.status(200).render('main/health'));

// =============================================================================
// SECURITY HEADERS MIDDLEWARE
// =============================================================================
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

module.exports = app;
