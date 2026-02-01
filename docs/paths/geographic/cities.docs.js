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
const createCity = standardRequest('post', {
  tags: ['Geographic'],
  operationId: 'createCity',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['idSubDivision', 'idTimezone', 'name'],
          properties: {
            idSubDivision: {
              type: 'integer',
              description: '**[Required]** ID of the subdivision to which the city belongs.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idTimezone: {
              type: 'integer',
              description:
                '**[Required]** ID of the time zone governing the city. This setup allows for different time zones within a country or even a subdivision.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: '**[Required]** Original name of the city.',
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

const updateCitiesStatus = standardRequest('patch', {
  tags: ['Geographic'],
  operationId: 'updateCitiesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['idSubDivision', 'idTimezone', 'name'],
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

const getListCities = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListCities',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getCityDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getCityDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateCity = standardRequest('put', {
  tags: ['Geographic'],
  operationId: 'updateCity',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            idSubDivision: {
              type: 'integer',
              description: '**[Optional]** ID of the subdivision to which the city belongs.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idTimezone: {
              type: 'integer',
              description:
                '**[Optional]** ID of the time zone governing the city. This setup allows for different time zones within a country or even a subdivision.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: '**[Optional]** Original name of the city.',
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

const deleteCity = standardRequest('delete', {
  tags: ['Geographic'],
  operationId: 'deleteCity',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createCity, ...updateCitiesStatus, ...getListCities };
const pathWithId = { ...getCityDetails, ...updateCity, ...deleteCity };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
