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
const createDevice = standardRequest('post', {
  tags: ['Users'],
  operationId: 'createDevice',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['accountId', 'fingerprint'],
          properties: {
            accountId: {
              type: 'integer',
              description: setReference(true, 'Account ID that owns this device.', 'Users', 'getListAccounts'),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            fingerprint: {
              type: 'string',
              description: 'Unique hash identifying the device (based on user agent, IP pattern, etc).',
              maxLength: 64,
              example: faker.string.alphanumeric(64),
            },
            name: {
              type: 'string',
              description: 'Friendly name for the device (e.g., "iPhone de Juan", "Chrome en Windows").',
              maxLength: 150,
              example: faker.string.alphanumeric(150),
            },
            type: {
              type: 'string',
              description: 'Type of device.',
              enum: ['desktop', 'mobile', 'tablet', 'other'],
              example: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet', 'other']),
            },
            browser: {
              type: 'string',
              description: 'Browser name and version.',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
            },
            os: {
              type: 'string',
              description: 'Operating system.',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
            },
            isTrusted: {
              type: 'boolean',
              description: 'Indicates whether the device is trusted.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
            isBlocked: {
              type: 'boolean',
              description: 'Indicates whether the device has been blocked.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
            lastIp: {
              type: 'string',
              description: 'Last IP address used by this device.',
              maxLength: 45,
              example: faker.string.alphanumeric(45),
            },
            lastUsedAt: {
              type: 'string',
              description: 'Last time this device was used.',
              format: 'date-time',
              example: dayjs(faker.date.future()).format('YYYY-MM-DD HH:mm:ss'),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateDevicesStatus = standardRequest('patch', {
  tags: ['Users'],
  operationId: 'updateDevicesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['accountId', 'fingerprint'],
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

const getListDevices = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getListDevices',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'accountId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'type',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'string', enum: ['desktop', 'mobile', 'tablet', 'other'] },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getDeviceDetails = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getDeviceDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateDevice = standardRequest('put', {
  tags: ['Users'],
  operationId: 'updateDevice',
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
              description: setReference(false, 'Account ID that owns this device.', 'Users', 'getListAccounts'),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            fingerprint: {
              type: 'string',
              description: 'Unique hash identifying the device (based on user agent, IP pattern, etc).',
              maxLength: 64,
              example: faker.string.alphanumeric(64),
            },
            name: {
              type: 'string',
              description: 'Friendly name for the device (e.g., "iPhone de Juan", "Chrome en Windows").',
              maxLength: 150,
              example: faker.string.alphanumeric(150),
            },
            type: {
              type: 'string',
              description: 'Type of device.',
              enum: ['desktop', 'mobile', 'tablet', 'other'],
              example: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet', 'other']),
            },
            browser: {
              type: 'string',
              description: 'Browser name and version.',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
            },
            os: {
              type: 'string',
              description: 'Operating system.',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
            },
            isTrusted: {
              type: 'boolean',
              description: 'Indicates whether the device is trusted.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
            isBlocked: {
              type: 'boolean',
              description: 'Indicates whether the device has been blocked.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
            lastIp: {
              type: 'string',
              description: 'Last IP address used by this device.',
              maxLength: 45,
              example: faker.string.alphanumeric(45),
            },
            lastUsedAt: {
              type: 'string',
              description: 'Last time this device was used.',
              format: 'date-time',
              example: dayjs(faker.date.future()).format('YYYY-MM-DD HH:mm:ss'),
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

const deleteDevice = standardRequest('delete', {
  tags: ['Users'],
  operationId: 'deleteDevice',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createDevice, ...updateDevicesStatus, ...getListDevices };
const pathWithId = { ...getDeviceDetails, ...updateDevice, ...deleteDevice };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
