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
const createPolitical_division = standardRequest('post', {
  tags: ['Geographic'],
  operationId: 'createPolitical_division',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: [],
          properties: {},
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updatePoliticaldivisionsStatus = standardRequest('patch', {
  tags: ['Geographic'],
  operationId: 'updatePoliticaldivisionsStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: [],
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

const getListPoliticaldivisions = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListPoliticaldivisions',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getPolitical_divisionDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getPolitical_divisionDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updatePolitical_division = standardRequest('put', {
  tags: ['Geographic'],
  operationId: 'updatePolitical_division',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            ...activeBody,
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const deletePolitical_division = standardRequest('delete', {
  tags: ['Geographic'],
  operationId: 'deletePolitical_division',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createPolitical_division, ...updatePoliticaldivisionsStatus, ...getListPoliticaldivisions };
const pathWithId = { ...getPolitical_divisionDetails, ...updatePolitical_division, ...deletePolitical_division };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
