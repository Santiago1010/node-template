const paginationParameters = [
  {
    name: 'limit',
    in: 'query',
    description:
      '***[Optional]*** Specifies the maximum number of records to return per page. Defaults to 10 if not provided. Must be used in conjunction with `page`.',
    schema: { type: 'integer', example: 10 },
    required: false,
  },
  {
    name: 'page',
    in: 'query',
    description:
      '***[Optional]*** Indicates the page number of results to retrieve. Defaults to the first page if not provided. Must be used in conjunction with `limit`.',
    schema: { type: 'integer', example: 1 },
    required: false,
  },
  {
    name: 'search',
    in: 'query',
    description:
      '***[Optional]*** Filters records by searching for the specified string across all fields. Only records containing the string will be returned.',
    schema: { type: 'string' },
    required: false,
  },
];

const activeParameter = [
  {
    name: 'active',
    in: 'query',
    description:
      '***[Optional]*** Filters records based on their active status. If `true`, only active records (where `deletedAt` is null) are returned. If `false`, only inactive records are returned. If not provided, all records are returned.',
    schema: { type: 'boolean', enum: [true, false] },
    required: false,
  },
];

const idsFilter = [
  {
    name: 'ids',
    in: 'query',
    description:
      '***[Optional]*** Filters records by their primary IDs. Provide a comma-separated list of IDs (e.g., `1,2,3,4`). If not provided, no filtering by IDs will be applied.',
    schema: { type: 'string' },
    required: false,
  },
];

const fieldsFilter = [
  {
    name: 'fields',
    in: 'query',
    description:
      '***[Optional]*** Specifies the fields to include in the response. Provide a comma-separated list of field names (e.g., `id,created_at,updated_at,deleted_at`). If not provided, all fields will be returned.',
    schema: { type: 'string' },
    required: false,
  },
];

const detailsParams = [
  {
    name: 'identifier',
    in: 'path',
    description: '***[Required]*** Unique identifier of the record.',
    schema: { type: 'integer' },
    required: true,
  },
  ...fieldsFilter,
  {
    name: 'includeHistory',
    in: 'query',
    description:
      '***[Optional]*** If set to `true`, the history of the record will be included in the response. If not provided, the history will not be included.',
    schema: { type: 'boolean', enum: [true, false], default: false },
    required: false,
  },
];

module.exports = { paginationParameters, activeParameter, idsFilter, fieldsFilter, detailsParams };
