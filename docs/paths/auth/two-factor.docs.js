// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');

const enable2fa = standardRequest('patch', {
  tags: ['Auth'],
  operationId: 'enable2fa',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          required: ['dialCodeId'],
          properties: {
            dialCodeId: { type: 'number', description: '', example: faker.number.int({ min: 1, max: 250 }) },
            number: { type: 'string', description: '', example: faker.phone.number() },
            channel: {
              type: 'string',
              description: '',
              enum: ['sms', 'whatsapp'],
              example: faker.helpers.arrayElement(['sms', 'whatsapp']),
            },
          },
        },
      },
    },
  },
  responses: {},
});

const disable2fa = standardRequest('delete', {
  tags: ['Auth'],
  operationId: 'disable2fa',
  description: '',
  responses: {},
  security: [{ jwtCookieAuth: [] }],
});

const get2faStatus = standardRequest('get', {
  tags: ['Auth'],
  operationId: 'get2faStatus',
  description: '',
  responses: {},
  security: [{ jwtCookieAuth: [] }],
});

module.exports = { enable2fa, disable2fa, get2faStatus };
