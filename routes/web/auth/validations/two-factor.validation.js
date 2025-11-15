const { commonSchemas } = require('../../../../helpers/validations');

const verifyOTPSchema = {
  otpCode: commonSchemas.stringSchema('otpCode', 'body', { required: true, minSecurityLevel: 0 }),
};

module.exports = { verifyOTPSchema };
