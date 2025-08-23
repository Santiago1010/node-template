const searchParams = [
  {
    name: 'search',
    in: 'query',
    description:
      '***[Optional]*** Filters records by searching for the specified string across all fields. Only records containing the string will be returned.',
    schema: { type: 'string' },
    required: false,
  },
];

module.exports = searchParams;
