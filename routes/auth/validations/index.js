const confirmationSchemas = require('./confirmation.validation');
const deviceSchemas = require('./devices.validation');
const passwordSchemas = require('./password.validation');
const sessionSchemas = require('./session.validations');
const twoFactorSchemas = require('./two-factor.validation');

module.exports = { confirmationSchemas, deviceSchemas, passwordSchemas, sessionSchemas, twoFactorSchemas };
