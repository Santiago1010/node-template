// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');

const signup = standardRequest('post', {
  tags: ['Auth'],
  operationId: 'signup',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          required: ['firstName', 'firstLastName', 'email', 'password'],
          properties: {
            firstName: {
              type: 'string',
              description: '',
              example: faker.person.firstName(),
            },
            firstLastName: {
              type: 'string',
              description: '',
              example: faker.person.lastName(),
            },
            email: {
              type: 'string',
              description: '',
              example: faker.internet.email().toLowerCase(),
            },
            password: {
              type: 'string',
              description: '',
              example: faker.internet.password(),
            },
            preferences: {
              type: 'object',
              description: '',
              properties: {
                lang: { type: 'string', description: '', example: faker.location.language().alpha2 },
                timezone: { type: 'string', description: '', example: faker.location.timeZone() },
                theme: { type: 'string', description: '', example: faker.helpers.arrayElement(['ligth', 'dark']) },
              },
            },
          },
        },
      },
    },
  },
  responses: {},
});

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

const logout = standardRequest('delete', {
  tags: ['Auth'],
  operationId: 'logout',
  description: '',
  security: [{ jwtCookieAuth: [] }],
});

module.exports = { signup, login, logout };
