// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');

const showPublicKey = standardRequest('get', {
  tags: ['Security'],
  operationId: 'showPublicKey',
  description: '',
  responses: {},
});

module.exports = { showPublicKey };
