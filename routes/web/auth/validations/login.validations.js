const { commonSchemas } = require('../../../../helpers/validations');

const loginSchema = {
  credential: commonSchemas.stringSchema('credential', 'body', { required: true }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true }),
  fingerprint: commonSchemas.stringSchema('fingerprint', 'body', { required: true }),
};

module.exports = { loginSchema };
