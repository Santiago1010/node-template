const { commonSchemas } = require('../../../../helpers/validations');

const loginSchema = {
  credential: commonSchemas.stringSchema('credential', 'body', { required: true, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
};

module.exports = { loginSchema };
