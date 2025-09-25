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
const {{CRATE_NAME}} = standardRequest('post', {
  tags: [{{TAG}}],
  operationId: '{{CRATE_NAME}}',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: [],
          properties: {
            {{CRATE_PROPERTIES}}
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const {{STATUS_NAME}} = standardRequest('patch', {
  tags: [{{TAG}}],
  operationId: '{{STATUS_NAME}}',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: [],
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

const {{LIST_NAME}} = standardRequest('get', {
  tags: [{{TAG}}],
  operationId: '{{LIST_NAME}}',
  description: '',
  parameters: [...commonListParams, ...activeParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const {{DETAILS_NAME}} = standardRequest('get', {
  tags: [{{TAG}}],
  operationId: '{{DETAILS_NAME}}',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateTest = standardRequest('put', {
  tags: [{{TAG}}],
  operationId: 'updateTest',
  description: '',
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            {{UPDATE_PROPERTIES}}
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const {{DELETE_NAME}} = standardRequest('delete', {
  tags: [{{TAG}}],
  operationId: '{{DELETE_NAME}}',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...{{CRATE_NAME}}, ...{{STATUS_NAME}}, ...{{LIST_NAME}} };
const pathWithId = { ...{{DETAILS_NAME}}, ...updateTest, ...{{DELETE_NAME}} };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
