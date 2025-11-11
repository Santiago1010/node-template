// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');

const fogotPassword = standardRequest('post', {
  tags: ['Auth'],
  operationId: 'fogotPassword',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          required: ['email'],
          properties: {
            email: { type: 'string', description: '', example: faker.internet.email().toLowerCase() },
          },
        },
      },
    },
  },
  responses: {},
});

const recoverPassword = standardRequest('patch', {
  tags: ['Auth'],
  operationId: 'recoverPassword',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          required: ['token', 'password'],
          properties: {
            token: {
              type: 'string',
              description: '',
              example: faker.string.alphanumeric({ length: { min: 20, max: 50 } }),
            },
            password: { type: 'string', description: '', example: faker.internet.password() },
          },
        },
      },
    },
  },
  responses: {},
});

module.exports = { fogotPassword, recoverPassword };
