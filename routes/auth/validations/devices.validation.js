const { commonSchemas } = require('../../../helpers/validations');

const confirmDeviceSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true }),
  rely: commonSchemas.booleanSchema('rely', 'body', { required: true }),
  block: commonSchemas.booleanSchema('block', 'body', { required: true }),
};

const updateDeviceSchema = {
  deviceId: commonSchemas.stringSchema('deviceId', 'params', { required: true }), // TODO: databaseSchemas
  rely: commonSchemas.booleanSchema('rely', 'body', { required: false }),
  block: commonSchemas.booleanSchema('block', 'body', { required: false }),
  active: commonSchemas.booleanSchema('active', 'body', { required: false }),
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { confirmDeviceSchema, updateDeviceSchema };
