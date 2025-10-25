// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');

const sendConfirmationEmail = standardRequest('post', {
  tags: ['Auth'],
  operationId: 'sendConfirmationEmail',
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
});

const confirmEmail = standardRequest('patch', {
  tags: ['Auth'],
  operationId: 'confirmEmail',
  description: '',
  parameters: [
    {
      name: 'token',
      in: 'path',
      description: '',
      schema: { type: 'string' },
      required: true,
    },
  ],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          required: ['password'],
          properties: {
            password: {
              type: 'string',
              description: '',
              example: faker.internet.password(),
            },
          },
        },
      },
    },
  },
});

module.exports = { sendConfirmationEmail, confirmEmail };
