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
const createEndpoint = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createEndpoint',
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
              description: 'Method of the endpoint to which permission will be granted.',
              enum: ['post', 'get', 'put', 'patch', 'delete', 'options'],
              example: faker.helpers.arrayElement(['post', 'get', 'put', 'patch', 'delete', 'options']),
            },
            version: {
              type: 'string',
              description: 'Version identifier of the endpoint configuration',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            endpointGroup: {
              type: 'string',
              description: 'Grouping of different endpoints',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            path: {
              type: 'string',
              description: 'Path of the endpoint to which permission will be granted.',
              maxLength: 200,
              example: faker.string.alphanumeric(200),
            },
            description: {
              type: 'string',
              description: "Optional description of the endpoint's function.",
              example: faker.lorem.sentences(10),
            },
            requiresAuthorization: {
              type: 'boolean',
              description: 'Indicates whether or not the endpoint requires authorization to be executed.',
              example: faker.datatype.boolean(),
            },
            hasSensitiveInformation: {
              type: 'boolean',
              description:
                'Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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
      description: '',
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

const updateEndpoint = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updateEndpoint',
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
              description: 'Method of the endpoint to which permission will be granted.',
              enum: ['post', 'get', 'put', 'patch', 'delete', 'options'],
              example: faker.helpers.arrayElement(['post', 'get', 'put', 'patch', 'delete', 'options']),
            },
            version: {
              type: 'string',
              description: 'Version identifier of the endpoint configuration',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            endpointGroup: {
              type: 'string',
              description: 'Grouping of different endpoints',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            path: {
              type: 'string',
              description: 'Path of the endpoint to which permission will be granted.',
              maxLength: 200,
              example: faker.string.alphanumeric(200),
            },
            description: {
              type: 'string',
              description: "Optional description of the endpoint's function.",
              example: faker.lorem.sentences(10),
            },
            requiresAuthorization: {
              type: 'boolean',
              description: 'Indicates whether or not the endpoint requires authorization to be executed.',
              example: faker.datatype.boolean(),
            },
            hasSensitiveInformation: {
              type: 'boolean',
              description:
                'Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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

const deleteEndpoint = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deleteEndpoint',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createEndpoint, ...updateEndpointsStatus, ...getListEndpoints };
const pathWithId = { ...getEndpoinDetails, ...updateEndpoint, ...deleteEndpoint };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
