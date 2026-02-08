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
const createDial_code = standardRequest('post', {
  tags: ['Geographic'],
  operationId: 'createDial_code',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['countryId', 'code', 'mask'],
          properties: {
            countryId: {
              type: 'integer',
              description: setReference(
                true,
                'Country ID to which the dialing code belongs.',
                'Geographic',
                'getListCountries'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            code: {
              type: 'string',
              description: 'Dialing code.',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            mask: {
              type: 'string',
              description: 'Mask for each number that uses the dialing code.',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateDialcodesStatus = standardRequest('patch', {
  tags: ['Geographic'],
  operationId: 'updateDialcodesStatus',
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

const getListDialcodes = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListDialcodes',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'countryId',
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
const getDial_codeDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getDial_codeDetails',
  description: '',
  parameters: [
    ...detailsParams,
    {
      name: 'countryId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateDial_code = standardRequest('put', {
  tags: ['Geographic'],
  operationId: 'updateDial_code',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            countryId: {
              type: 'integer',
              description: setReference(
                false,
                'Country ID to which the dialing code belongs.',
                'Geographic',
                'getListCountries'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            code: {
              type: 'string',
              description: 'Dialing code.',
              maxLength: 10,
              example: faker.string.alphanumeric(10),
            },
            mask: {
              type: 'string',
              description: 'Mask for each number that uses the dialing code.',
              maxLength: 50,
              example: faker.string.alphanumeric(50),
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

const deleteDial_code = standardRequest('delete', {
  tags: ['Geographic'],
  operationId: 'deleteDial_code',
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
const basePath = { ...createDial_code, ...updateDialcodesStatus, ...getListDialcodes };
const pathWithId = { ...getDial_codeDetails, ...updateDial_code, ...deleteDial_code };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
