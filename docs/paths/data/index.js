const currencies = require('./currencies.docs');
const flags = require('./flags.docs');
const languages = require('./languages.docs');
const timezones = require('./timezones.docs');

module.exports = {
  '/data/currencies': { ...currencies.basePath },
  '/data/currencies/{id}': { ...currencies.pathWithId },
  '/data/flags': { ...flags.basePath },
  '/data/flags/{id}': { ...flags.pathWithId },
  '/data/languages': { ...languages.basePath },
  '/data/languages/{id}': { ...languages.pathWithId },
  '/data/timezones': { ...timezones.basePath },
  '/data/timezones/{id}': { ...timezones.pathWithId },
};
