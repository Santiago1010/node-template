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
const createContinent = standardRequest('post', {
  tags: ['Geographic'],
  operationId: 'createContinent',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'abbreviation', 'surfaceArea'],
          properties: {
            name: {
              type: 'object',
              description: 'Continent name, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'string',
              description: 'Continent abbreviation.',
              maxLength: 3,
              example: faker.string.alphanumeric(3),
            },
            surfaceArea: {
              type: 'integer',
              description: 'Approximate surface area of the continent (measured in km²).',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateContinentsStatus = standardRequest('patch', {
  tags: ['Geographic'],
  operationId: 'updateContinentsStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'abbreviation', 'surfaceArea'],
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

const getListContinents = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListContinents',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getContinentDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getContinentDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateContinent = standardRequest('put', {
  tags: ['Geographic'],
  operationId: 'updateContinent',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'object',
              description: 'Continent name, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'string',
              description: 'Continent abbreviation.',
              maxLength: 3,
              example: faker.string.alphanumeric(3),
            },
            surfaceArea: {
              type: 'integer',
              description: 'Approximate surface area of the continent (measured in km²).',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
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

const deleteContinent = standardRequest('delete', {
  tags: ['Geographic'],
  operationId: 'deleteContinent',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createContinent, ...updateContinentsStatus, ...getListContinents };
const pathWithId = { ...getContinentDetails, ...updateContinent, ...deleteContinent };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
