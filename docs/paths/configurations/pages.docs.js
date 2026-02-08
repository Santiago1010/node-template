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
const createPage = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createPage',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['hostId', 'name', 'path'],
          properties: {
            hostId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the client to which the page belongs.',
                'Configurations',
                'getListHosts'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            pageId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the parent page to which the child belongs. If null, it is a "first-line page".',
                'Configurations',
                'getListPages'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'Page name (extracted from Vue router 4).',
              maxLength: 100,
              example: faker.lorem.word(),
            },
            path: {
              type: 'string',
              description:
                'Path of the specific page for identification. It must be exactly the same as the path used by the end user to access the view.',
              maxLength: 200,
              example: '/page/path',
            },
            description: {
              type: 'string',
              description: 'Optional description of what can be done or viewed on the page.',
              example: faker.lorem.sentences(10),
            },
            level: {
              type: 'integer',
              description: 'Indicates whether it is level 1, 2, or 3 (this being the last level allowed).',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            requiresAuthorization: {
              type: 'boolean',
              description: 'Indicates whether the page requires authorization to access it.',
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

const updatePagesStatus = standardRequest('patch', {
  tags: ['Configurations'],
  operationId: 'updatePagesStatus',
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

const getListPages = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getListPages',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'hostId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'pageId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
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
const getPageDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getPageDetails',
  description: '',
  parameters: [
    ...detailsParams,
    {
      name: 'hostId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'pageId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
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

const updatePage = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updatePage',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            hostId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the client to which the page belongs.',
                'Configurations',
                'getListHosts'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            pageId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the parent page to which the child belongs. If null, it is a "first-line page".',
                'Configurations',
                'getListPages'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'Page name (extracted from Vue router 4).',
              maxLength: 100,
              example: faker.lorem.word(),
            },
            path: {
              type: 'string',
              description:
                'Path of the specific page for identification. It must be exactly the same as the path used by the end user to access the view.',
              maxLength: 200,
              example: faker.string.alphanumeric(200),
            },
            description: {
              type: 'string',
              description: 'Optional description of what can be done or viewed on the page.',
              example: faker.lorem.sentences(10),
            },
            level: {
              type: 'integer',
              description: 'Indicates whether it is level 1, 2, or 3 (this being the last level allowed).',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            requiresAuthorization: {
              type: 'boolean',
              description: 'Indicates whether the page requires authorization to access it.',
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

const deletePage = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deletePage',
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
const basePath = { ...createPage, ...updatePagesStatus, ...getListPages };
const pathWithId = { ...getPageDetails, ...updatePage, ...deletePage };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
