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
const createUser = standardRequest('post', {
  tags: ['Users'],
  operationId: 'createUser',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['firstName', 'firstLastName'],
          properties: {
            firstName: {
              type: 'string',
              description: '**[Required]** First name of the user/customer.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            secondName: {
              type: 'string',
              description: '**[Optional]** Second name of the user/client (if applicable).',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            firstLastName: {
              type: 'string',
              description: '**[Required]** First surname of the user/customer.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            secondLastName: {
              type: 'string',
              description: '**[Optional]** Second surname of the user/client (if applicable).',
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

const updateUsersStatus = standardRequest('patch', {
  tags: ['Users'],
  operationId: 'updateUsersStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['firstName', 'firstLastName'],
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

const getListUsers = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getListUsers',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getUserDetails = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getUserDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateUser = standardRequest('put', {
  tags: ['Users'],
  operationId: 'updateUser',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: '**[Optional]** First name of the user/customer.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            secondName: {
              type: 'string',
              description: '**[Optional]** Second name of the user/client (if applicable).',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            firstLastName: {
              type: 'string',
              description: '**[Optional]** First surname of the user/customer.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            secondLastName: {
              type: 'string',
              description: '**[Optional]** Second surname of the user/client (if applicable).',
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

const deleteUser = standardRequest('delete', {
  tags: ['Users'],
  operationId: 'deleteUser',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createUser, ...updateUsersStatus, ...getListUsers };
const pathWithId = { ...getUserDetails, ...updateUser, ...deleteUser };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
