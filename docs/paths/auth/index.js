const confirmation = require('./confirmation.docs');
const password = require('./password.docs');
const session = require('./session.docs');

const authDocs = {
  '/auth/signup': { ...session.signup },
  '/auth/resend-confirmation': { ...confirmation.sendConfirmationEmail },
  '/auth/confirm-email/{token}': { ...confirmation.confirmEmail },
  '/auth/login': { ...session.login },
  '/auth/logout': { ...session.logout },
  '/auth/forgot-password': { ...password.fogotPassword },
  '/auth/recover-password': { ...password.recoverPassword },
};

module.exports = authDocs;
