const auth = require('./auth');
const security = require('./security');

const paths = { ...auth, ...security };

module.exports = { paths };
