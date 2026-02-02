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
const createHost = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createHost',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['url', 'isDefault'],
          properties: {
            url: {
              type: 'string',
              description: 'URN of the allowed hosts.',
              maxLength: 150,
              example: faker.string.alphanumeric(150),
            },
            isDefault: {
              type: 'boolean',
              description: 'Indicates whether this is the default host or not. There can only be one.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateHostsStatus = standardRequest('patch', {
  tags: ['Configurations'],
  operationId: 'updateHostsStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['url', 'isDefault'],
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

const getListHosts = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getListHosts',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getHostDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getHostDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateHost = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updateHost',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URN of the allowed hosts.',
              maxLength: 150,
              example: faker.string.alphanumeric(150),
            },
            isDefault: {
              type: 'boolean',
              description: 'Indicates whether this is the default host or not. There can only be one.',
              enum: [true, false],
              example: faker.datatype.boolean(),
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

const deleteHost = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deleteHost',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createHost, ...updateHostsStatus, ...getListHosts };
const pathWithId = { ...getHostDetails, ...updateHost, ...deleteHost };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
