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
];

module.exports = paginationParameters;
