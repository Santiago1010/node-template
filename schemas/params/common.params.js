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

module.exports = { ...idsFilter, ...fieldsFilter, ...detailsParams };
