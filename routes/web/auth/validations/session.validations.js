const { commonSchemas } = require('../../../../helpers/validations');

const signupSchema = {
  firstName: commonSchemas.stringSchema('firstName', 'body', { required: true, maxLength: 100, minSecurityLevel: 0 }),
  firstLastName: commonSchemas.stringSchema('firstLastName', 'body', {
    required: true,
    maxLength: 100,
    minSecurityLevel: 0,
  }),
  email: commonSchemas.stringSchema('email', 'body', { required: true, maxLength: 150, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
};

const loginSchema = {
  credential: commonSchemas.stringSchema('credential', 'body', { required: true, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
};

const logoutSchema = {};

module.exports = { signupSchema, loginSchema, logoutSchema };
