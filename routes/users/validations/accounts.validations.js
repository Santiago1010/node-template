const { usrAccounts, usrUsers, configRoles, geoDialCodes } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createAccountSchema = {
  userId: databaseSchemas.idSchema('userId', 'body', { model: usrUsers, required: true, minSecurityLevel: 1 }),
  rolId: databaseSchemas.idSchema('rolId', 'body', { model: configRoles, required: true, minSecurityLevel: 1 }),
  dialCodeId: databaseSchemas.idSchema('dialCodeId', 'body', {
    model: geoDialCodes,
    required: false,
    minSecurityLevel: 1,
  }),
  recoveryEmail: commonSchemas.stringSchema('recoveryEmail', 'body', {
    required: false,
    minSecurityLevel: 1,
    pattern: '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/',
  }),
  recoveryEmailConfirmedAt: commonSchemas.dateSchema('recoveryEmailConfirmedAt', 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  password: commonSchemas.stringSchema('password', 'body', { required: true, minSecurityLevel: 1, maxLength: 200 }),
  twoFactorEnabled: commonSchemas.numberSchema('twoFactorEnabled', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const updateAccountsStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: usrAccounts, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListAccountsSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(usrAccounts),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  userId: databaseSchemas.idSchema('userId', 'query', { model: usrUsers, required: false, minSecurityLevel: 1 }),
  rolId: databaseSchemas.idSchema('rolId', 'query', { model: configRoles, required: false, minSecurityLevel: 1 }),
  dialCodeId: databaseSchemas.idSchema('dialCodeId', 'query', {
    model: geoDialCodes,
    required: false,
    minSecurityLevel: 1,
  }),
  // Add any additional query parameters here
};

const getAccountDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: usrAccounts,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(usrAccounts),
  // Add any additional query parameters here
};

const updateAccountSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrAccounts,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  userId: databaseSchemas.idSchema('userId', 'body', { model: usrUsers, required: false, minSecurityLevel: 1 }),
  rolId: databaseSchemas.idSchema('rolId', 'body', { model: configRoles, required: false, minSecurityLevel: 1 }),
  dialCodeId: databaseSchemas.idSchema('dialCodeId', 'body', {
    model: geoDialCodes,
    required: false,
    minSecurityLevel: 1,
  }),
  recoveryEmail: commonSchemas.stringSchema('recoveryEmail', 'body', {
    required: false,
    minSecurityLevel: 1,
    pattern: '/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/',
  }),
  recoveryEmailConfirmedAt: commonSchemas.dateSchema('recoveryEmailConfirmedAt', 'body', {
    required: false,
    minSecurityLevel: 1,
  }),
  password: commonSchemas.stringSchema('password', 'body', { required: false, minSecurityLevel: 1, maxLength: 200 }),
  twoFactorEnabled: commonSchemas.numberSchema('twoFactorEnabled', 'body', {
    required: false,
    minSecurityLevel: 1,
    minValue: -128,
    maxValue: 127,
  }),
  // Add any additional body parameters here
};

const deleteAccountSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrAccounts,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createAccountSchema,
  updateAccountsStatusSchema,
  getListAccountsSchema,
  getAccountDetailsSchema,
  updateAccountSchema,
  deleteAccountSchema,
};
