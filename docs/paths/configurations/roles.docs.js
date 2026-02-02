// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
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
const createRole = standardRequest('post', {
  tags: ['Configurations'],
  operationId: 'createRole',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['securityLevelId', 'name'],
          properties: {
            securityLevelId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the security level that the role can access.',
                'Configurations',
                'getListSecuritylevels'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'Role name.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            target: {
              type: 'string',
              description:
                'Defines who the profiles are available for (linked to the tables that store user information).',
              enum: ['employee', 'customer'],
              example: faker.helpers.arrayElement(['employee', 'customer']),
            },
            isDefault: {
              type: 'boolean',
              description: 'Indicates whether the role is the default. There can only be one per target.',
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

const updateRolesStatus = standardRequest('patch', {
  tags: ['Configurations'],
  operationId: 'updateRolesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['securityLevelId', 'name'],
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

const getListRoles = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getListRoles',
  description: '',
  parameters: [
    ...commonListParams,
    ...activeParams,
    {
      name: 'securityLevelId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'target',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'string', enum: ['employee', 'customer'] },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getRoleDetails = standardRequest('get', {
  tags: ['Configurations'],
  operationId: 'getRoleDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updateRole = standardRequest('put', {
  tags: ['Configurations'],
  operationId: 'updateRole',
  description: '',
  parameters: [...identifierParam],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            securityLevelId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the security level that the role can access.',
                'Configurations',
                'getListSecuritylevels'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            name: {
              type: 'string',
              description: 'Role name.',
              maxLength: 100,
              example: faker.string.alphanumeric(100),
            },
            target: {
              type: 'string',
              description:
                'Defines who the profiles are available for (linked to the tables that store user information).',
              enum: ['employee', 'customer'],
              example: faker.helpers.arrayElement(['employee', 'customer']),
            },
            isDefault: {
              type: 'boolean',
              description: 'Indicates whether the role is the default. There can only be one per target.',
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

const deleteRole = standardRequest('delete', {
  tags: ['Configurations'],
  operationId: 'deleteRole',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createRole, ...updateRolesStatus, ...getListRoles };
const pathWithId = { ...getRoleDetails, ...updateRole, ...deleteRole };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
