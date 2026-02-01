// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const dayjs = require('dayjs');
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { standardRequest } = require('../../../helpers/docs-generator.helper');
const { setReference } = require('../schemas/params/dynamic.params');
const {
  commonListParams,
  activeParams,
  activeBody,
  detailsParams,
  identifierParam,
} = require('../../../schemas/params/common.params');

// =============================== BASE PATH =============================== //
const createAccess = standardRequest('post', {
  tags: ['Users'],
  operationId: 'createAccess',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['accountId', 'deviceId', 'idToken', 'expiresAt'],
          properties: {
            accountId: {
              type: 'integer',
              description: setReference(true, 'Account ID.', 'Users', 'getListAccounts'),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            deviceId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the device from which the access was recorded.',
                'Users',
                'getListDevices'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idToken: {
              type: 'string',
              description:
                '**[Required]** Unique ID of the encrypted JWT token (not the primary key because it is recommended to encrypt it).',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            expiresAt: {
              type: 'string',
              description: '**[Required]** Date and time the access expires. Updated each time the token is refreshed.',
              format: 'date-time',
              example: dayjs(faker.date.future()).format('YYYY-MM-DD HH:mm:ss'),
            },
            isSafeMode: {
              type: 'boolean',
              description: '**[Optional]** Indicates whether access was performed in safe mode.',
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

const updateAccessesStatus = standardRequest('patch', {
  tags: ['Users'],
  operationId: 'updateAccessesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['accountId', 'deviceId', 'idToken', 'expiresAt'],
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

const getListAccesses = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getListAccesses',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'accountId',
      in: 'query',
      description: '**[Optional]** ',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'deviceId',
      in: 'query',
      description: '**[Optional]** ',
      required: false,
      schema: { type: 'integer' },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getAccessDetails = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getAccessDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateAccess = standardRequest('put', {
  tags: ['Users'],
  operationId: 'updateAccess',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            accountId: {
              type: 'integer',
              description: setReference(false, 'Account ID.', 'Users', 'getListAccounts'),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            deviceId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the device from which the access was recorded.',
                'Users',
                'getListDevices'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            idToken: {
              type: 'string',
              description:
                '**[Optional]** Unique ID of the encrypted JWT token (not the primary key because it is recommended to encrypt it).',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            expiresAt: {
              type: 'string',
              description: '**[Optional]** Date and time the access expires. Updated each time the token is refreshed.',
              format: 'date-time',
              example: dayjs(faker.date.future()).format('YYYY-MM-DD HH:mm:ss'),
            },
            isSafeMode: {
              type: 'boolean',
              description: '**[Optional]** Indicates whether access was performed in safe mode.',
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

const deleteAccess = standardRequest('delete', {
  tags: ['Users'],
  operationId: 'deleteAccess',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createAccess, ...updateAccessesStatus, ...getListAccesses };
const pathWithId = { ...getAccessDetails, ...updateAccess, ...deleteAccess };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
