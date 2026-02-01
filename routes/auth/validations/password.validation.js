const { commonSchemas } = require('../../../../helpers/validations');

const fogotPasswordSchema = {
  email: commonSchemas.stringSchema('email', 'body', { required: true, maxLength: 150, minSecurityLevel: 0 }),
};

const recoverPasswordSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
};

const changePasswordSchema = {
  currentPassword: commonSchemas.passwordSchema('currentPassword', 'body', { required: true, minSecurityLevel: 0 }),
  newPassword: commonSchemas.passwordSchema('newPassword', 'body', { required: true, minSecurityLevel: 0 }),
};

module.exports = { fogotPasswordSchema, recoverPasswordSchema, changePasswordSchema };
