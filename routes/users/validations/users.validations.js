const { usrUsers } = require('../../../../config/database/connection').models;
const { commonSchemas, databaseSchemas } = require('../../../helpers/validations');
const { paginationSchemas, searchSchemas, filtersSchemas } = require('../../../../schemas/validations');

const createUserSchema = {
  firstName: commonSchemas.stringSchema('firstName', 'body', { required: true, minSecurityLevel: 1, maxLength: 100 }),
  secondName: commonSchemas.stringSchema('secondName', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  firstLastName: commonSchemas.stringSchema('firstLastName', 'body', {
    required: true,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  secondLastName: commonSchemas.stringSchema('secondLastName', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  // Add any additional body parameters here
};

const updateUsersStatusSchema = {
  ids: databaseSchemas.validateMultipleIds('ids', 'body', { model: usrUsers, required: true, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: true, minSecurityLevel: 1 }),
  // Add any additional body parameters here
};

const getListUsersSchema = {
  ...paginationSchemas,
  ...searchSchemas,
  ...filtersSchemas(usrUsers),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  // Add any additional query parameters here
};

const getUserDetailsSchema = {
  id: databaseSchemas.validateValueAgainstModel('id', 'params', {
    model: usrUsers,
    required: false,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  search: commonSchemas.stringSchema('search', 'query', { required: false, minSecurityLevel: 1 }),
  fields: commonSchemas.stringSchema('fields', 'query', { required: false, minSecurityLevel: 1 }),
  active: commonSchemas.booleanSchema('active', 'query', { required: false, minSecurityLevel: 1 }),
  includeHistory: commonSchemas.booleanSchema('includeHistory', 'query', { required: false, minSecurityLevel: 1 }),
  ...filtersSchemas(usrUsers),
  // Add any additional query parameters here
};

const updateUserSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrUsers,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
  firstName: commonSchemas.stringSchema('firstName', 'body', { required: false, minSecurityLevel: 1, maxLength: 100 }),
  secondName: commonSchemas.stringSchema('secondName', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  firstLastName: commonSchemas.stringSchema('firstLastName', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  secondLastName: commonSchemas.stringSchema('secondLastName', 'body', {
    required: false,
    minSecurityLevel: 1,
    maxLength: 100,
  }),
  // Add any additional body parameters here
};

const deleteUserSchema = {
  id: databaseSchemas.idSchema('id', 'params', {
    model: usrUsers,
    required: true,
    minSecurityLevel: 1,
    paranoid: false,
  }),
};

module.exports = {
  createUserSchema,
  updateUsersStatusSchema,
  getListUsersSchema,
  getUserDetailsSchema,
  updateUserSchema,
  deleteUserSchema,
};
