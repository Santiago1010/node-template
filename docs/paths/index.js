const auth = require('./auth');
const config = require('./configurations');
const security = require('./security');

const paths = { ...auth, ...config, ...security };

module.exports = { paths };
