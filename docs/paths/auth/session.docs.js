// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');

const login = standardRequest('post', {
  tags: ['Auth'],
  operationId: 'login',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          required: ['credential', 'password', 'fingerprint'],
          properties: {
            credential: { type: 'string', description: '', example: faker.internet.email().toLowerCase() },
            password: { type: 'string', description: '', example: faker.internet.password() },
          },
        },
      },
    },
  },
  responses: {},
});

module.exports = { login };
