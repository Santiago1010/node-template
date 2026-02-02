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
const createCurrency = standardRequest('post', {
  tags: ['Data'],
  operationId: 'createCurrency',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'abbreviation', 'symbol'],
          properties: {
            name: {
              type: 'object',
              description: 'Official name of the currency in several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'string',
              description: 'Abbreviation for currency.',
              maxLength: 15,
              example: faker.string.alphanumeric(15),
            },
            symbol: {
              type: 'string',
              description: 'Symbol that differentiates the currency.',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateCurrenciesStatus = standardRequest('patch', {
  tags: ['Data'],
  operationId: 'updateCurrenciesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'abbreviation', 'symbol'],
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

const getListCurrencies = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getListCurrencies',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getCurrencyDetails = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getCurrencyDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateCurrency = standardRequest('put', {
  tags: ['Data'],
  operationId: 'updateCurrency',
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
              description: 'Official name of the currency in several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'string',
              description: 'Abbreviation for currency.',
              maxLength: 15,
              example: faker.string.alphanumeric(15),
            },
            symbol: {
              type: 'string',
              description: 'Symbol that differentiates the currency.',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
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

const deleteCurrency = standardRequest('delete', {
  tags: ['Data'],
  operationId: 'deleteCurrency',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createCurrency, ...updateCurrenciesStatus, ...getListCurrencies };
const pathWithId = { ...getCurrencyDetails, ...updateCurrency, ...deleteCurrency };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
