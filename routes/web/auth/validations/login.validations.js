const { commonSchemas } = require('../../../../helpers/validations');

const signupSchema = {};

const loginSchema = {
  credential: commonSchemas.stringSchema('credential', 'body', { required: true, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
};

const logoutSchema = {};

module.exports = { signupSchema, loginSchema, logoutSchema };
