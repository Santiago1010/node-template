const auth = require('./auth');
const config = require('./configurations');
const data = require('./data');
const security = require('./security');

const paths = { ...auth, ...config, ...data, ...security };

module.exports = { paths };
