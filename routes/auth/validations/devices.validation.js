const { commonSchemas } = require('../../../../helpers/validations');

const confirmDeviceSchema = {
  token: commonSchemas.stringSchema('token', 'params', { required: true, minSecurityLevel: 0 }),
  password: commonSchemas.passwordSchema('password', 'body', { required: true, minSecurityLevel: 0 }),
  rely: commonSchemas.booleanSchema('rely', 'body', { required: true, minSecurityLevel: 0 }),
  block: commonSchemas.booleanSchema('block', 'body', { required: true, minSecurityLevel: 0 }),
};

const updateDeviceSchema = {
  deviceId: commonSchemas.stringSchema('deviceId', 'params', { required: true, minSecurityLevel: 0 }), // TODO: databaseSchemas
  rely: commonSchemas.booleanSchema('rely', 'body', { required: false, minSecurityLevel: 0 }),
  block: commonSchemas.booleanSchema('block', 'body', { required: false, minSecurityLevel: 0 }),
  active: commonSchemas.booleanSchema('active', 'body', { required: false, minSecurityLevel: 0 }),
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { confirmDeviceSchema, updateDeviceSchema };
