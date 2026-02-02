const { commonSchemas } = require('../../../helpers/validations');

const fogotPasswordSchema = {
  email: commonSchemas.stringSchema('email', 'body', { required: true, maxLength: 150 }),
};

const recoverPasswordSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true }),
};

const changePasswordSchema = {
  currentPassword: commonSchemas.passwordSchema('currentPassword', 'body', { required: true }),
  newPassword: commonSchemas.passwordSchema('newPassword', 'body', { required: true }),
};

module.exports = { fogotPasswordSchema, recoverPasswordSchema, changePasswordSchema };
