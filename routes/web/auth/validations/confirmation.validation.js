const { commonSchemas } = require('../../../../helpers/validations');

const sendConfirmationEmailSchema = {
  email: commonSchemas.stringSchema('email', 'body', { required: true, maxLength: 150, minSecurityLevel: 0 }),
};

const confirmEmailSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true, minSecurityLevel: 0 }),
};

module.exports = { sendConfirmationEmailSchema, confirmEmailSchema };
