const { usrPreferences, usrAccounts, dataLanguages, dataTimezones } =
  require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createPreferenceSchema = {
  accountId: databaseSchemas.idSchema('accountId', 'body', { model: usrAccounts, required: true, minSecurityLevel: 1 }),
  languageId: databaseSchemas.idSchema('languageId', 'body', {
    model: dataLanguages,
    required: true,
    minSecurityLevel: 1,
  }),
  timezoneId: databaseSchemas.idSchema('timezoneId', 'body', {
    model: dataTimezones,
    required: true,
    minSecurityLevel: 1,
  }),
  theme: commonSchemas.inSchema('theme', ['ligth', 'dark'], 'body', { required: false, minSecurityLevel: 1 }),
  whatsapp: commonSchemas.numberSchema('whatsapp', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  sms: commonSchemas.numberSchema('sms', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  email: commonSchemas.numberSchema('email', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const updatePreferencesStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', {
    model: usrPreferences,
    required: true,
    minSecurityLevel: 1,
  }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListPreferencesSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(usrPreferences),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  accountId: databaseSchemas.idSchema('accountId', 'query', {
    model: usrAccounts,
    required: false,
    minSecurityLevel: 1,
  }),
  languageId: databaseSchemas.idSchema('languageId', 'query', {
    model: dataLanguages,
    required: false,
    minSecurityLevel: 1,
  }),
  timezoneId: databaseSchemas.idSchema('timezoneId', 'query', {
    model: dataTimezones,
    required: false,
    minSecurityLevel: 1,
  }),
  theme: commonSchemas.inSchema('theme', ['ligth', 'dark'], 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getPreferenceDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: usrPreferences,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(usrPreferences),
  // Add any additional query parameters here
};

const updatePreferenceSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrPreferences,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  accountId: databaseSchemas.idSchema('accountId', 'body', {
    model: usrAccounts,
    required: false,
    minSecurityLevel: 1,
  }),
  languageId: databaseSchemas.idSchema('languageId', 'body', {
    model: dataLanguages,
    required: false,
    minSecurityLevel: 1,
  }),
  timezoneId: databaseSchemas.idSchema('timezoneId', 'body', {
    model: dataTimezones,
    required: false,
    minSecurityLevel: 1,
  }),
  theme: commonSchemas.inSchema('theme', ['ligth', 'dark'], 'body', { required: false, minSecurityLevel: 1 }),
  whatsapp: commonSchemas.numberSchema('whatsapp', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  sms: commonSchemas.numberSchema('sms', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  email: commonSchemas.numberSchema('email', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const deletePreferenceSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrPreferences,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createPreferenceSchema,
  updatePreferencesStatusSchema,
  getListPreferencesSchema,
  getPreferenceDetailsSchema,
  updatePreferenceSchema,
  deletePreferenceSchema,
};
