const session = require('./session.docs');

const authDocs = { '/auth/login': { ...session.login } };

module.exports = authDocs;
