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
const createTimezone = standardRequest('post', {
  tags: ['Data'],
  operationId: 'createTimezone',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['continentId', 'name', 'utc'],
          properties: {
            continentId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the continent to which the time zone belongs. This facilitates more efficient filtering of the required time zones.',
                'Geographic',
                'getListContinents'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'International name or identifier of the time zone (in "Continent/Zone" format).',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
            },
            utc: {
              type: 'string',
              description: 'Coordinated Universal Time (UTC) offset of each time zone.',
              maxLength: 6,
              example: faker.string.alphanumeric(6),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateTimezonesStatus = standardRequest('patch', {
  tags: ['Data'],
  operationId: 'updateTimezonesStatus',
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

const getListTimezones = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getListTimezones',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'continentId',
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
const getTimezoneDetails = standardRequest('get', {
  tags: ['Data'],
  operationId: 'getTimezoneDetails',
  description: '',
  parameters: [
    ...detailsParams,
    {
      name: 'continentId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateTimezone = standardRequest('put', {
  tags: ['Data'],
  operationId: 'updateTimezone',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            continentId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the continent to which the time zone belongs. This facilitates more efficient filtering of the required time zones.',
                'Geographic',
                'getListContinents'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'International name or identifier of the time zone (in "Continent/Zone" format).',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
            },
            utc: {
              type: 'string',
              description: 'Coordinated Universal Time (UTC) offset of each time zone.',
              maxLength: 6,
              example: faker.string.alphanumeric(6),
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

const deleteTimezone = standardRequest('delete', {
  tags: ['Data'],
  operationId: 'deleteTimezone',
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
const basePath = { ...createTimezone, ...updateTimezonesStatus, ...getListTimezones };
const pathWithId = { ...getTimezoneDetails, ...updateTimezone, ...deleteTimezone };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
