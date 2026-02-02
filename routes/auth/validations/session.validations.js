const { commonSchemas } = require('../../../helpers/validations');
const paginationSchema = require('../../../schemas/validations/pagination.schema');

const signupSchema = {
  firstName: commonSchemas.stringSchema('firstName', 'body', { required: true, maxLength: 100 }),
  firstLastName: commonSchemas.stringSchema('firstLastName', 'body', {
    required: true,
    maxLength: 100,
  }),
  email: commonSchemas.stringSchema('email', 'body', { required: true, maxLength: 150 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true }),
};

const loginSchema = {
  credential: commonSchemas.stringSchema('credential', 'body', { required: true }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true }),
};

const logoutSchema = {};

const getSessionsSchema = {
  ...paginationSchema,
  active: commonSchemas.booleanSchema('active', 'query', { required: false }),
};

const revokeSessionSchema = {
  sessionId: commonSchemas.stringSchema('sessionId', 'params', { required: true }),
};

const revokeAllSessionExceptCurrentSchema = {};

module.exports = {
  signupSchema,
  loginSchema,
  logoutSchema,
  getSessionsSchema,
  revokeSessionSchema,
  revokeAllSessionExceptCurrentSchema,
};
