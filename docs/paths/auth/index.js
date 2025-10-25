const session = require('./session.docs');

const authDocs = {
  '/auth/signup': { ...session.signup },
  '/auth/login': { ...session.login },
  '/auth/logout': { ...session.logout },
};

module.exports = authDocs;
