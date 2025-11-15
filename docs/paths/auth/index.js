const confirmation = require('./confirmation.docs');
const device = require('./devices.docs');
const password = require('./password.docs');
const session = require('./session.docs');
const twoFactor = require('./two-factor.docs');

const authDocs = {
  '/auth/confirm-email/{token}': { ...confirmation.confirmEmail },
  '/auth/resend-confirmation': { ...confirmation.sendConfirmationEmail },
  '/auth/signup': { ...session.signup },

  '/auth/login': { ...session.login },
  '/auth/logout': { ...session.logout },
  '/auth/refresh-token': { ...session.refreshToken },

  '/auth/session/{sessionid}/revoke': { ...session.revokeSession },
  '/auth/sessions': { ...session.readAllSessions },
  '/auth/sessions/revoke-all-except-current': { ...session.revokeAllSessionsExceptCurrent },

  '/auth/change-password': { ...password.changePassword },
  '/auth/forgot-password': { ...password.fogotPassword },
  '/auth/recover-password/{token}': { ...password.recoverPassword },

  '/auth/verify-device/{token}': { ...device.verifyDevice },

  '/auth/disable-2fa': { ...twoFactor.disable2fa },
  '/auth/enable-2fa': { ...twoFactor.enable2fa },
  '/auth/get-2fa-status': { ...twoFactor.get2faStatus },
  '/auth/send-verify-code': { ...twoFactor.sendOtpCode },
  '/auth/verify-code': { ...session.verifyOTP },

  // TODO: '/auth/webauthn/register': {}
  // TODO: '/auth/webauthn/verify': {}
  // TODO: '/auth/impersonate/:userId': {}
};

module.exports = authDocs;
