// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');
const { setReference } = require('../../../schemas/params/dynamic.params');
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
          required: ['subDivisionId', 'timezoneId', 'name'],
          properties: {
            subDivisionId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the subdivision to which the city belongs.',
                'Geographic',
                'getListPoliticaldivisions'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            timezoneId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the time zone governing the city. This setup allows for different time zones within a country or even a subdivision.',
                'Data',
                'getListTimezones'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'Original name of the city.',
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
          required: ['ids', 'active'],
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

const getListCities = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListCities',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'subDivisionId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'timezoneId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getCityDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getCityDetails',
  description: '',
  parameters: [
    ...detailsParams,
    {
      name: 'subDivisionId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'timezoneId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
  ],
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
            subDivisionId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the subdivision to which the city belongs.',
                'Geographic',
                'getListPoliticaldivisions'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            timezoneId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the time zone governing the city. This setup allows for different time zones within a country or even a subdivision.',
                'Data',
                'getListTimezones'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'Original name of the city.',
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
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            justification: {
              type: 'string',
              description: 'The reason why the record is deleted.',
              example: faker.lorem.sentence(),
            },
          },
        },
      },
    },
  },
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
