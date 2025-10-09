// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
const { I18n } = require('i18n');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const config = require('../../config/env');
const { PATHS } = require('../../utils/constants.util');

const i18n = new I18n({
  locales: ['es', 'en'],
  directory: PATHS.LOCALES,
  fallbacks: { 'en-*': 'en' },
  defaultLocale: config.lang || 'en',
  autoReload: process.env.NODE_ENV !== 'test',
  updateFiles: process.env.NODE_ENV !== 'test',
  syncFiles: true,
  logWarnFn: console.warn,
  logErrorFn: console.error,
  objectNotation: true,
  header: 'Accept-Language',
  queryParameter: 'lang',
  cookie: {
    name: 'lang',
    options: {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 365,
    },
  },
});

i18n.setLocale(config.lang);

module.exports = i18n;
