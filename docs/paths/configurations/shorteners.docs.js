// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const dayjs = require('dayjs');
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
const createShortener = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createShortener',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['url', 'codeShortener'],
          properties: {
            url: {
              type: 'string',
              description: '**[Required]** Full URL.',
              maxLength: 255,
              example: faker.string.alphanumeric(255),
            },
            codeShortener: {
              type: 'string',
              description: '**[Required]** Unique identification code for link.',
              maxLength: 8,
              example: faker.string.alphanumeric(8),
            },
            expiresAt: {
              type: 'string',
              description: '**[Optional]** Date and time limit for use of the shortener.',
              format: 'date-time',
              example: dayjs(faker.date.future()).format('YYYY-MM-DD HH:mm:ss'),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateShortenersStatus = standardRequest('patch', {
  tags: ['Configurations'],
  operationId: 'updateShortenersStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['url', 'codeShortener'],
          properties: {
            ids: {
              type: 'array',
              description: '**[Required]** Array of IDs of the records to be deactivated or reactivated.',
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

const getListShorteners = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getListShorteners',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getShortenerDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getShortenerDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateShortener = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updateShortener',
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
              description: '**[Optional]** Full URL.',
              maxLength: 255,
              example: faker.string.alphanumeric(255),
            },
            codeShortener: {
              type: 'string',
              description: '**[Optional]** Unique identification code for link.',
              maxLength: 8,
              example: faker.string.alphanumeric(8),
            },
            expiresAt: {
              type: 'string',
              description: '**[Optional]** Date and time limit for use of the shortener.',
              format: 'date-time',
              example: dayjs(faker.date.future()).format('YYYY-MM-DD HH:mm:ss'),
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

const deleteShortener = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deleteShortener',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createShortener, ...updateShortenersStatus, ...getListShorteners };
const pathWithId = { ...getShortenerDetails, ...updateShortener, ...deleteShortener };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
