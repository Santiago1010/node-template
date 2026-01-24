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
            password: { type: 'string', description: '', example: faker.internet.password() },
          },
        },
      },
    },
  },
  responses: {},
});

const changePassword = standardRequest('patch', {
  tags: ['Auth'],
  operationId: 'changePassword',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', description: '', example: faker.internet.password() },
            newPassword: { type: 'string', description: '', example: faker.internet.password() },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ jwtCookieAuth: [] }],
});

module.exports = { fogotPassword, recoverPassword, changePassword };
