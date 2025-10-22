const { commonSchemas } = require('../../../../helpers/validations');

const loginSchema = {
  credential: commonSchemas.stringSchema('credential', 'body', { required: true, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
};

const logoutSchema = {};

module.exports = { loginSchema, logoutSchema };
