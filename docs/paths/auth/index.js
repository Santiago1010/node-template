const session = require('./session.docs');

const authDocs = { '/auth/signup': { ...session.signup }, '/auth/login': { ...session.login } };

module.exports = authDocs;
