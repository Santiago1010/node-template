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
const createRegion = standardRequest('post', {
  tags: ['Geographic'],
  operationId: 'createRegion',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['continentId', 'name'],
          properties: {
            continentId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the continent to which the region belongs.',
                'Geographic',
                'getListContinents'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'object',
              description: 'Name of the region, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
            },
          },
        },
      },
    },
  },
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateRegionsStatus = standardRequest('patch', {
  tags: ['Geographic'],
  operationId: 'updateRegionsStatus',
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

const getListRegions = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getListRegions',
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
const getRegionDetails = standardRequest('get', {
  tags: ['Geographic'],
  operationId: 'getRegionDetails',
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

const updateRegion = standardRequest('put', {
  tags: ['Geographic'],
  operationId: 'updateRegion',
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
                'ID of the continent to which the region belongs.',
                'Geographic',
                'getListContinents'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'object',
              description: 'Name of the region, written in different languages for internationalization.',
              example: faker.helpers.objectValue({ key1: 'value1', key2: 'value2' }),
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

const deleteRegion = standardRequest('delete', {
  tags: ['Geographic'],
  operationId: 'deleteRegion',
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
const basePath = { ...createRegion, ...updateRegionsStatus, ...getListRegions };
const pathWithId = { ...getRegionDetails, ...updateRegion, ...deleteRegion };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
