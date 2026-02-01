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
const createSecurity_level = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createSecurity_level',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['slug', 'name', 'priority', 'isDefault'],
          properties: {
            slug: {
              type: 'string',
              description: '**[Required]** Name of the security level in slug format.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            name: {
              type: 'object',
              description: '**[Required]** Name of the security level with internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            priority: {
              type: 'integer',
              description: '**[Required]** 1 = least sensitive ... n = most sensitive.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            description: {
              type: 'object',
              description: '**[Optional]** Detailed description of each security level with internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            isDefault: {
              type: 'boolean',
              description:
                '**[Required]** Indicate whether this is a default level. Only one can be marked as default.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateSecuritylevelsStatus = standardRequest('patch', {
  tags: ['Configurations'],
  operationId: 'updateSecuritylevelsStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['slug', 'name', 'priority', 'isDefault'],
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

const getListSecuritylevels = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getListSecuritylevels',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getSecurity_levelDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getSecurity_levelDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateSecurity_level = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updateSecurity_level',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: '**[Optional]** Name of the security level in slug format.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            name: {
              type: 'object',
              description: '**[Optional]** Name of the security level with internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            priority: {
              type: 'integer',
              description: '**[Optional]** 1 = least sensitive ... n = most sensitive.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            description: {
              type: 'object',
              description: '**[Optional]** Detailed description of each security level with internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
            isDefault: {
              type: 'boolean',
              description:
                '**[Optional]** Indicate whether this is a default level. Only one can be marked as default.',
              enum: [true, false],
              example: faker.datatype.boolean(),
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

const deleteSecurity_level = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deleteSecurity_level',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createSecurity_level, ...updateSecuritylevelsStatus, ...getListSecuritylevels };
const pathWithId = { ...getSecurity_levelDetails, ...updateSecurity_level, ...deleteSecurity_level };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
