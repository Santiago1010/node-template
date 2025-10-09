const { standardRequest } = require('../../../helpers/docs-generator.helper');

const login = standardRequest('post', {
  tags: ['Auth', 'Administration'],
  operationId: 'login',
});

module.exports = { login };
