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
          required: ['idRegion', 'idFlag', 'popularName', 'officialName', 'abbreviation', 'tld'],
          properties: {
            idRegion: {
              type: 'integer',
              description: '**[Required]** ID of the region to which the country belongs.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idCapital: {
              type: 'integer',
              description: "**[Optional]** ID of the country's capital city.",
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idFlag: {
              type: 'integer',
              description: '**[Required]** ID of the country’s flag.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            popularName: {
              type: 'object',
              description:
                '**[Required]** Name of the country, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            officialName: {
              type: 'object',
              description: '**[Required]** Official language of the country translated into several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'object',
              description:
                '**[Required]** ISO 3166-1 alpha-2 two-letter country codes and ISO 3166-1 alpha-3 three-letter country codes of the country.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            surfaceArea: {
              type: 'string',
              description: '**[Optional]** Approximate surface area of the country (measured in km²).',
              maxLength: 15,
              example: faker.string.alphanumeric(15),
            },
            tld: {
              type: 'string',
              description: '**[Required]** Internet top level domains',
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
          required: ['idRegion', 'idFlag', 'popularName', 'officialName', 'abbreviation', 'tld'],
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

const getListCountries = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListCountries',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getCountryDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getCountryDetails',
  description: '',
  parameters: [...detailsParams],
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
            idRegion: {
              type: 'integer',
              description: '**[Optional]** ID of the region to which the country belongs.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idCapital: {
              type: 'integer',
              description: "**[Optional]** ID of the country's capital city.",
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idFlag: {
              type: 'integer',
              description: '**[Optional]** ID of the country’s flag.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            popularName: {
              type: 'object',
              description:
                '**[Optional]** Name of the country, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            officialName: {
              type: 'object',
              description: '**[Optional]** Official language of the country translated into several languages.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            abbreviation: {
              type: 'object',
              description:
                '**[Optional]** ISO 3166-1 alpha-2 two-letter country codes and ISO 3166-1 alpha-3 three-letter country codes of the country.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            surfaceArea: {
              type: 'string',
              description: '**[Optional]** Approximate surface area of the country (measured in km²).',
              maxLength: 15,
              example: faker.string.alphanumeric(15),
            },
            tld: {
              type: 'string',
              description: '**[Optional]** Internet top level domains',
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
