const auth = require('./auth');
const config = require('./configurations');
const data = require('./data');
const geo = require('./geographic');
const security = require('./security');

const paths = { ...auth, ...config, ...data, ...geo, ...security };

module.exports = { paths };
