const { commonSchemas } = require('../../../../helpers/validations');

const sendConfirmationEmailSchema = {
  email: commonSchemas.stringSchema('email', 'body', { required: true, maxLength: 150, minSecurityLevel: 0 }),
};

module.exports = { sendConfirmationEmailSchema };
