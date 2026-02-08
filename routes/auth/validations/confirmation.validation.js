const { commonSchemas } = require('../../../helpers/validations');

const sendConfirmationEmailSchema = {
  email: commonSchemas.stringSchema('email', 'body', { required: true, maxLength: 150 }),
};

const confirmEmailSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true }),
};

const confirmDeviceSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true }),
  rely: commonSchemas.booleanSchema('rely', 'body', { required: true }),
  block: commonSchemas.booleanSchema('block', 'body', { required: true }),
};

module.exports = { sendConfirmationEmailSchema, confirmEmailSchema, confirmDeviceSchema };
