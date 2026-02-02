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
const createScope = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createScope',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Unique scope name (in snake_case and separated by a colon).',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            description: {
              type: 'string',
              description: 'Description of the permissions that the scope has.',
              example: faker.lorem.sentences(10),
            },
            isSelectable: {
              type: 'boolean',
              description:
                'Indicates whether the scope is selectable or deselectable to be configured for specific roles and/or accounts. If false, it should not be displayed to the public.',
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

const updateScopesStatus = standardRequest('patch', {
  tags: ['Configurations'],
  operationId: 'updateScopesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name'],
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

const getListScopes = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getListScopes',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getScopeDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getScopeDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateScope = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updateScope',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Unique scope name (in snake_case and separated by a colon).',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            description: {
              type: 'string',
              description: 'Description of the permissions that the scope has.',
              example: faker.lorem.sentences(10),
            },
            isSelectable: {
              type: 'boolean',
              description:
                'Indicates whether the scope is selectable or deselectable to be configured for specific roles and/or accounts. If false, it should not be displayed to the public.',
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

const deleteScope = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deleteScope',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createScope, ...updateScopesStatus, ...getListScopes };
const pathWithId = { ...getScopeDetails, ...updateScope, ...deleteScope };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
