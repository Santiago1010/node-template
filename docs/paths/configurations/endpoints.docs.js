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
              example: 'v' + faker.number.int({ min: 1, max: 5 }),
            },
            endpointGroup: {
              type: 'string',
              description: 'Grouping of different endpoints',
              maxLength: 100,
              example: faker.helpers.arrayElement(['auth', 'config', 'users']),
            },
            path: {
              type: 'string',
              description: 'Path of the endpoint to which permission will be granted.',
              maxLength: 200,
              example: '/endpoint/path',
            },
            description: {
              type: 'string',
              description: "Optional description of the endpoint's function.",
              example: faker.lorem.sentences(10),
            },
            requiresAuthorization: {
              type: 'boolean',
              description: 'Indicates whether or not the endpoint requires authorization to be executed.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
            hasSensitiveInformation: {
              type: 'boolean',
              description:
                'Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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
    {
      name: 'requiresAuthorization',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'boolean' },
    },
    {
      name: 'hasSensitiveInformation',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'boolean' },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getEndpointDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getEndpointDetails',
  description: '',
  parameters: [
    ...detailsParams,
    {
      name: 'method',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'string', enum: ['post', 'get', 'put', 'patch', 'delete', 'options'] },
    },
    {
      name: 'requiresAuthorization',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'boolean' },
    },
    {
      name: 'hasSensitiveInformation',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'boolean' },
    },
  ],
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
              example: 'v' + faker.number.int({ min: 1, max: 5 }),
            },
            endpointGroup: {
              type: 'string',
              description: 'Grouping of different endpoints',
              maxLength: 100,
              example: faker.helpers.arrayElement(['auth', 'config', 'users']),
            },
            path: {
              type: 'string',
              description: 'Path of the endpoint to which permission will be granted.',
              maxLength: 200,
              example: '/endpoint/path',
            },
            description: {
              type: 'string',
              description: "Optional description of the endpoint's function.",
              example: faker.lorem.sentences(10),
            },
            requiresAuthorization: {
              type: 'boolean',
              description: 'Indicates whether or not the endpoint requires authorization to be executed.',
              enum: [true, false],
              example: faker.datatype.boolean(),
            },
            hasSensitiveInformation: {
              type: 'boolean',
              description:
                'Indicates whether the page contains sensitive information. Useful for defining what is and is not allowed in "safe mode."',
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
const pathWithId = { ...getEndpointDetails, ...updateEndpoint, ...deleteEndpoint };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
