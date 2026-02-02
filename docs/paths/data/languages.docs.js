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
const createLanguage = standardRequest('post', {
  tags: ['Data'],
  operationId: 'createLanguage',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['abbreviation', 'name'],
          properties: {
            idFlag: {
              type: 'integer',
              description: 'ID of the flag that will be displayed alongside the language.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            abbreviation: {
              type: 'string',
              description: 'Language abbreviation, typically used for internationalization libraries.',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            version: {
              type: 'string',
              description:
                'Version of the language for different parts of the world that speak the same language. This is completely optional.',
              maxLength: 4,
              example: faker.string.alphanumeric(4),
            },
            name: {
              type: 'object',
              description: 'Name of the language, written in multiple languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            description: {
              type: 'object',
              description:
                'Explanatory description of the language, provided in English as it is the standard in software development.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            orientation: {
              type: 'string',
              description:
                'The language can have different writing orientations: left-to-right (L2R), right-to-left (R2L), top-to-bottom with left-to-right direction (T2BL2R), or top-to-bottom with right-to-left direction (T2BR2L).',
              enum: ['l2r', 'r2l', 't2bl2r', 't2br2l'],
              example: faker.helpers.arrayElement(['l2r', 'r2l', 't2bl2r', 't2br2l']),
            },
            public: {
              type: 'integer',
              description: 'Indicates whether this is a selectable language to change the platform language.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateLanguagesStatus = standardRequest('patch', {
  tags: ['Data'],
  operationId: 'updateLanguagesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['abbreviation', 'name'],
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

const getListLanguages = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getListLanguages',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'orientation',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'string', enum: ['l2r', 'r2l', 't2bl2r', 't2br2l'] },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getLanguageDetails = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getLanguageDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateLanguage = standardRequest('put', {
  tags: ['Data'],
  operationId: 'updateLanguage',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            idFlag: {
              type: 'integer',
              description: 'ID of the flag that will be displayed alongside the language.',
              min: 0,
              max: 2147483647,
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            abbreviation: {
              type: 'string',
              description: 'Language abbreviation, typically used for internationalization libraries.',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            version: {
              type: 'string',
              description:
                'Version of the language for different parts of the world that speak the same language. This is completely optional.',
              maxLength: 4,
              example: faker.string.alphanumeric(4),
            },
            name: {
              type: 'object',
              description: 'Name of the language, written in multiple languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            description: {
              type: 'object',
              description:
                'Explanatory description of the language, provided in English as it is the standard in software development.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            orientation: {
              type: 'string',
              description:
                'The language can have different writing orientations: left-to-right (L2R), right-to-left (R2L), top-to-bottom with left-to-right direction (T2BL2R), or top-to-bottom with right-to-left direction (T2BR2L).',
              enum: ['l2r', 'r2l', 't2bl2r', 't2br2l'],
              example: faker.helpers.arrayElement(['l2r', 'r2l', 't2bl2r', 't2br2l']),
            },
            public: {
              type: 'integer',
              description: 'Indicates whether this is a selectable language to change the platform language.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
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

const deleteLanguage = standardRequest('delete', {
  tags: ['Data'],
  operationId: 'deleteLanguage',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createLanguage, ...updateLanguagesStatus, ...getListLanguages };
const pathWithId = { ...getLanguageDetails, ...updateLanguage, ...deleteLanguage };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
