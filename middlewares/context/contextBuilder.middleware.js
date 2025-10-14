const ContextHelper = require('../../helpers/context.helper');

const setHost = async (req, _, next) => {
  try {
    const fullHost = req.protocol + '://' + req.get('host');

    console.dir(fullHost, { depth: null });

    return ContextHelper.run(req.body, () => next());
  } catch (error) {
    return next(error);
  }
};

module.exports = { setHost };
