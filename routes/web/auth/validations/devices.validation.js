const { commonSchemas } = require('../../../../helpers/validations');

const confirmDeviceSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
  rely: commonSchemas.booleanSchema('rely', 'body', { required: true, minSecurityLevel: 0 }),
  block: commonSchemas.booleanSchema('block', 'body', { required: true, minSecurityLevel: 0 }),
};

module.exports = { confirmDeviceSchema };
