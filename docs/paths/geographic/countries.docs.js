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
const createCountry = standardRequest('post', {
  tags: ['Geographic'],
  operationId: 'createCountry',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['regionId', 'flagId', 'popularName', 'officialName', 'abbreviation', 'tld'],
          properties: {
            regionId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the region to which the country belongs.',
                'Geographic',
                'getListRegions'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            capitalId: {
              type: 'integer',
              description: "ID of the country's capital city.",
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            flagId: {
              type: 'integer',
              description: setReference(true, "ID of the country's flag.", 'Data', 'getListFlags'),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            popularName: {
              type: 'object',
              description: 'Name of the country, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            officialName: {
              type: 'object',
              description: 'Official language of the country translated into several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'object',
              description:
                'ISO 3166-1 alpha-2 two-letter country codes and ISO 3166-1 alpha-3 three-letter country codes of the country.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            tld: {
              type: 'string',
              description: 'Internet top level domains',
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

const updateCountriesStatus = standardRequest('patch', {
  tags: ['Geographic'],
  operationId: 'updateCountriesStatus',
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

const getListCountries = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListCountries',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'regionId',
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
    {
      name: 'flagId',
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
const getCountryDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getCountryDetails',
  description: '',
  parameters: [
    ...detailsParams,
    {
      name: 'regionId',
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
    {
      name: 'flagId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateCountry = standardRequest('put', {
  tags: ['Geographic'],
  operationId: 'updateCountry',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            regionId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the region to which the country belongs.',
                'Geographic',
                'getListRegions'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            capitalId: {
              type: 'integer',
              description: "ID of the country's capital city.",
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            flagId: {
              type: 'integer',
              description: setReference(false, "ID of the country's flag.", 'Data', 'getListFlags'),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            popularName: {
              type: 'object',
              description: 'Name of the country, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            officialName: {
              type: 'object',
              description: 'Official language of the country translated into several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'object',
              description:
                'ISO 3166-1 alpha-2 two-letter country codes and ISO 3166-1 alpha-3 three-letter country codes of the country.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            tld: {
              type: 'string',
              description: 'Internet top level domains',
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

const deleteCountry = standardRequest('delete', {
  tags: ['Geographic'],
  operationId: 'deleteCountry',
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
const basePath = { ...createCountry, ...updateCountriesStatus, ...getListCountries };
const pathWithId = { ...getCountryDetails, ...updateCountry, ...deleteCountry };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
