// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');
const {
  commonListParams,
  activeParams,
  activeBody,
  detailsParams,
  identifierParam,
} = require('../../../schemas/params/common.params');

// =============================== BASE PATH =============================== //
const createFlag = standardRequest('post', {
  tags: ['Data'],
  operationId: 'createFlag',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'emoji'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the flag or the country to which it belongs.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            emoji: {
              type: 'string',
              description: 'Flag emoji.',
              maxLength: 5,
              example: faker.string.alphanumeric(5),
            },
            location: {
              type: 'string',
              description: 'Partial or complete path of the location icon with the flag.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            flat2d: {
              type: 'string',
              description: 'Partial or complete path of the flag in its original format, without details.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            rounded2d: {
              type: 'string',
              description: 'Partial or complete path of the circular flag format, without additional details.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            wave2d: {
              type: 'string',
              description: 'Partial or complete path of the flag with waves, simulating a real flag waving.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            flat3d: {
              type: 'string',
              description:
                'Partial or complete path of the flag in its original format, with details that make it appear 3D.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            rounded3d: {
              type: 'string',
              description: 'Partial or complete path of the circular flag format, with details that make it appear 3D.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            wave3d: {
              type: 'string',
              description:
                'Partial or complete path of the circular flag format, with details that make it appear 3D and simulate a waving flag.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateFlagsStatus = standardRequest('patch', {
  tags: ['Data'],
  operationId: 'updateFlagsStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'emoji'],
          properties: {
            ids: {
              type: 'array',
              description: 'Array of IDs of the records to be deactivated or reactivated.',
              items: { type: 'integer' },
              example: faker.helpers.arrayElements([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
            },
            ...activeBody,
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const getListFlags = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getListFlags',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getFlagDetails = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getFlagDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateFlag = standardRequest('put', {
  tags: ['Data'],
  operationId: 'updateFlag',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the flag or the country to which it belongs.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            emoji: {
              type: 'string',
              description: 'Flag emoji.',
              maxLength: 5,
              example: faker.string.alphanumeric(5),
            },
            location: {
              type: 'string',
              description: 'Partial or complete path of the location icon with the flag.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            flat2d: {
              type: 'string',
              description: 'Partial or complete path of the flag in its original format, without details.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            rounded2d: {
              type: 'string',
              description: 'Partial or complete path of the circular flag format, without additional details.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            wave2d: {
              type: 'string',
              description: 'Partial or complete path of the flag with waves, simulating a real flag waving.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            flat3d: {
              type: 'string',
              description:
                'Partial or complete path of the flag in its original format, with details that make it appear 3D.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            rounded3d: {
              type: 'string',
              description: 'Partial or complete path of the circular flag format, with details that make it appear 3D.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            wave3d: {
              type: 'string',
              description:
                'Partial or complete path of the circular flag format, with details that make it appear 3D and simulate a waving flag.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            ...activeBody,
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const deleteFlag = standardRequest('delete', {
  tags: ['Data'],
  operationId: 'deleteFlag',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createFlag, ...updateFlagsStatus, ...getListFlags };
const pathWithId = { ...getFlagDetails, ...updateFlag, ...deleteFlag };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
