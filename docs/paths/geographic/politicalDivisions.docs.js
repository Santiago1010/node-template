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
          required: ['countryId', 'name', 'denomination'],
          properties: {
            countryId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the country to which the subdivision belongs.',
                'Geographic',
                'getListCountries'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            capitalId: {
              type: 'integer',
              description: 'ID of the capital city of the subdivision.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'object',
              description: 'Name of the political division in several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            denomination: {
              type: 'string',
              description: 'Definition of the type of subdivision (department, state, or province).',
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

const getListPoliticaldivisions = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListPoliticaldivisions',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'countryId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'capitalId',
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
const getPolitical_divisionDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getPolitical_divisionDetails',
  description: '',
  parameters: [
    ...detailsParams,
    {
      name: 'countryId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'capitalId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
  ],
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
            countryId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the country to which the subdivision belongs.',
                'Geographic',
                'getListCountries'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            capitalId: {
              type: 'integer',
              description: 'ID of the capital city of the subdivision.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'object',
              description: 'Name of the political division in several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            denomination: {
              type: 'string',
              description: 'Definition of the type of subdivision (department, state, or province).',
              example: faker.lorem.sentence(),
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

const deletePolitical_division = standardRequest('delete', {
  tags: ['Geographic'],
  operationId: 'deletePolitical_division',
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
const basePath = { ...createPolitical_division, ...updatePoliticaldivisionsStatus, ...getListPoliticaldivisions };
const pathWithId = { ...getPolitical_divisionDetails, ...updatePolitical_division, ...deletePolitical_division };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
