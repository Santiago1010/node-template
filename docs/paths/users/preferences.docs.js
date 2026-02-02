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
const createPreference = standardRequest('post', {
  tags: ['Users'],
  operationId: 'createPreference',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['accountId', 'languageId', 'timezoneId'],
          properties: {
            accountId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the account to which the preferences belong.',
                'Users',
                'getListAccounts'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            languageId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the language selected by the user as their preference.',
                'Data',
                'getListLanguages'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            timezoneId: {
              type: 'integer',
              description: setReference(
                true,
                'ID of the time zone that the user selects as their preference for the platform.',
                'Data',
                'getListTimezones'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            theme: {
              type: 'string',
              description: 'Preferred theme type (color scheme) of the platform for the user.',
              enum: ['ligth', 'dark'],
              example: faker.helpers.arrayElement(['ligth', 'dark']),
            },
            whatsapp: {
              type: 'integer',
              description: 'Indicates whether you allow receiving notifications via WhatsApp.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            sms: {
              type: 'integer',
              description: 'Indicates whether you allow receiving SMS notifications.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            email: {
              type: 'integer',
              description: 'Indicates whether you allow receiving notifications and/or advertising by email.',
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

const updatePreferencesStatus = standardRequest('patch', {
  tags: ['Users'],
  operationId: 'updatePreferencesStatus',
  description: '',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['accountId', 'languageId', 'timezoneId'],
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

const getListPreferences = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getListPreferences',
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
      name: 'languageId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'timezoneId',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'integer' },
    },
    {
      name: 'theme',
      in: 'query',
      description: '',
      required: false,
      schema: { type: 'string', enum: ['ligth', 'dark'] },
    },
  ],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ============================== PATH WITH ID ============================== //
const getPreferenceDetails = standardRequest('get', {
  tags: ['Users'],
  operationId: 'getPreferenceDetails',
  description: '',
  parameters: [...detailsParams],
  responses: {},
  security: [{ bearerAuth: [] }],
});

const updatePreference = standardRequest('put', {
  tags: ['Users'],
  operationId: 'updatePreference',
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
              description: setReference(
                false,
                'ID of the account to which the preferences belong.',
                'Users',
                'getListAccounts'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            languageId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the language selected by the user as their preference.',
                'Data',
                'getListLanguages'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            timezoneId: {
              type: 'integer',
              description: setReference(
                false,
                'ID of the time zone that the user selects as their preference for the platform.',
                'Data',
                'getListTimezones'
              ),
              example: faker.number.int({ min: 0, max: 2147483647 }),
            },
            theme: {
              type: 'string',
              description: 'Preferred theme type (color scheme) of the platform for the user.',
              enum: ['ligth', 'dark'],
              example: faker.helpers.arrayElement(['ligth', 'dark']),
            },
            whatsapp: {
              type: 'integer',
              description: 'Indicates whether you allow receiving notifications via WhatsApp.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            sms: {
              type: 'integer',
              description: 'Indicates whether you allow receiving SMS notifications.',
              min: 0,
              max: 9,
              example: faker.number.int({ min: 0, max: 9 }),
            },
            email: {
              type: 'integer',
              description: 'Indicates whether you allow receiving notifications and/or advertising by email.',
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

const deletePreference = standardRequest('delete', {
  tags: ['Users'],
  operationId: 'deletePreference',
  description: '',
  parameters: [...identifierParam],
  responses: {},
  security: [{ bearerAuth: [] }],
});

// ================================ EXPORTS ================================ //
const basePath = { ...createPreference, ...updatePreferencesStatus, ...getListPreferences };
const pathWithId = { ...getPreferenceDetails, ...updatePreference, ...deletePreference };

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { basePath, pathWithId };
