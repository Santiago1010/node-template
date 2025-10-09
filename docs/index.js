const basicInfo = require('./basicInfo');
const components = require('./components');
const paths = require('./paths');
const server = require('./server');
const tags = require('./tags');

module.exports = {
  ...basicInfo,
  ...components,
  ...paths,
  ...server,
  ...tags,
};
