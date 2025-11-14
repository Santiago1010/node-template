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

module.exports = { verifyDevice };
