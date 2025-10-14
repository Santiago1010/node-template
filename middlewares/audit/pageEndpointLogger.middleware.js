const ContextHelper = require('../../helpers/context.helper');

const pageUseEndpoint = async (_, __, next) => {
  const page = ContextHelper.get('page');
  const endpoint = ContextHelper.get('endpoint');

  console.log(`🔎 Page: ${page}`);
  console.log(`🔎 Endpoint: ${endpoint}`);

  return next();
};

module.exports = { pageUseEndpoint };
