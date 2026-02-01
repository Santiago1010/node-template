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
const createEndpoin = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createEndpoin',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['method', 'version', 'endpointGroup', 'path'],
          properties: {
            method: {
              type: 'string',
              description: '**[Required]** Method of the endpoint to which permission will be granted.',
              enum: ['post', 'get', 'put', 'patch', 'delete', 'options'],
              example: faker.helpers.arrayElement(['post', 'get', 'put', 'patch', 'delete', 'options']),
            },
            version: {
              type: 'string',
              description: '**[Required]** Version identifier of the endpoint configuration',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            endpointGroup: {
              type: 'string',
              description: '**[Required]** Grouping of different endpoints',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            path: {
              type: 'string',
              description: '**[Required]** Path of the endpoint to which permission will be granted.',
              maxLength: 200,
              example: faker.string.alphanumeric(200),
            },
            description: {
              type: 'string',
              description: "**[Optional]** Optional description of the endpoint's function.",
              example: faker.lorem.sentences(10),
            },
            requiresAuthorization: {
              type: 'integer',
              description:
                '**[Optional]** Indicates whether or not the endpoint requires authorization to be executed.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            hasSensitiveInformation: {
              type: 'integer',
              description:
                '**[Optional]** Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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

const updateEndpointsStatus = standardRequest('patch', {
  tags: ['Configurations'],
  operationId: 'updateEndpointsStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['method', 'version', 'endpointGroup', 'path'],
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

const getListEndpoints = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getListEndpoints',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'method',
      in: 'query',
      description: '**[Optional]** ',
      required: false,
      schema: { type: 'string', enum: ['post', 'get', 'put', 'patch', 'delete', 'options'] },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getEndpoinDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getEndpoinDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateEndpoin = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updateEndpoin',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: '**[Optional]** Method of the endpoint to which permission will be granted.',
              enum: ['post', 'get', 'put', 'patch', 'delete', 'options'],
              example: faker.helpers.arrayElement(['post', 'get', 'put', 'patch', 'delete', 'options']),
            },
            version: {
              type: 'string',
              description: '**[Optional]** Version identifier of the endpoint configuration',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            endpointGroup: {
              type: 'string',
              description: '**[Optional]** Grouping of different endpoints',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            path: {
              type: 'string',
              description: '**[Optional]** Path of the endpoint to which permission will be granted.',
              maxLength: 200,
              example: faker.string.alphanumeric(200),
            },
            description: {
              type: 'string',
              description: "**[Optional]** Optional description of the endpoint's function.",
              example: faker.lorem.sentences(10),
            },
            requiresAuthorization: {
              type: 'integer',
              description:
                '**[Optional]** Indicates whether or not the endpoint requires authorization to be executed.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            hasSensitiveInformation: {
              type: 'integer',
              description:
                '**[Optional]** Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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

const deleteEndpoin = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deleteEndpoin',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createEndpoin, ...updateEndpointsStatus, ...getListEndpoints };
const pathWithId = { ...getEndpoinDetails, ...updateEndpoin, ...deleteEndpoin };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
