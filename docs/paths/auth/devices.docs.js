// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');

const verifyDevice = standardRequest('patch', {
  tags: ['Auth'],
  operationId: 'verifyDevice',
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
          required: ['password', 'rely', 'block'],
          properties: {
            password: { type: 'string', description: '', example: faker.internet.password() },
            rely: { type: 'boolean', description: '', example: faker.datatype.boolean() },
            block: { type: 'boolean', description: '', example: faker.datatype.boolean() },
          },
        },
      },
    },
  },
  responses: {},
});

const readAllDevices = standardRequest('get', {
  tags: ['Auth'],
  operationId: 'readAllDevices',
  description: '',
  responses: {},
  security: [{ jwtCookieAuth: [] }],
});

const updateDevice = standardRequest('patch', {
  tags: ['Auth'],
  operationId: 'updateDevice',
  description: '',
  parameters: [
    {
      name: 'deviceId',
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
          required: ['rely', 'block'],
          properties: {
            rely: { type: 'boolean', description: '', example: faker.datatype.boolean() },
            block: { type: 'boolean', description: '', example: faker.datatype.boolean() },
            active: { type: 'boolean', description: '', example: faker.datatype.boolean() },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ jwtCookieAuth: [] }],
});

module.exports = { verifyDevice, readAllDevices, updateDevice };
