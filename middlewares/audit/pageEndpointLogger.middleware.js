const pageUseEndpoint = async (req, _, next) => {
  console.log(req.body);

  return next();
};

module.exports = { pageUseEndpoint };
