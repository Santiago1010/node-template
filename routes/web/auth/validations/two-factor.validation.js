// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { commonSchemas } = require('../../../../helpers/validations');

const enable2FASchema = {
  dialCodeId: commonSchemas.numberSchema('dialCodeId', 'body', {
    required: false,
    allowNull: false,
    minValue: 1,
    minSecurityLevel: 0,
  }),

  number: commonSchemas.stringSchema('number', 'body', {
    required: false,
    allowNull: false,
    pattern: /^[0-9]{7,15}$/,
    trim: true,
    minSecurityLevel: 0,
  }),

  channel: commonSchemas.inSchema('channel', ['sms', 'whatsapp'], 'body', {
    required: false,
    allowNull: false,
    caseSensitive: true,
    minSecurityLevel: 0,
  }),
};

const sendVerifyCodeSchema = {
  channel: commonSchemas.inSchema('channel', ['sms', 'whatsapp'], 'body', {
    required: true,
    allowNull: false,
    caseSensitive: true,
    minSecurityLevel: 0,
  }),

  purpose: commonSchemas.inSchema('purpose', ['login', 'transaction', 'sensitive_actions', 'secure_mode'], 'body', {
    required: false,
    allowNull: false,
    caseSensitive: true,
    minSecurityLevel: 0,
  }),
};

const verifyOTPSchema = {
  otpCode: commonSchemas.stringSchema('otpCode', 'body', {
    required: true,
    allowNull: false,
    minLength: 6,
    maxLength: 6,
    pattern: /^[0-9A-Z]{6}$/,
    trim: true,
    toUpperCase: true,
    minSecurityLevel: 0,
  }),

  purpose: commonSchemas.inSchema(
    'purpose',
    ['login', 'setup', 'transaction', 'sensitive_actions', 'secure_mode'],
    'body',
    {
      required: false,
      allowNull: false,
      caseSensitive: true,
      minSecurityLevel: 0,
    }
  ),
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { enable2FASchema, sendVerifyCodeSchema, verifyOTPSchema };
