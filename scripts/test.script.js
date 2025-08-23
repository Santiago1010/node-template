const { numberSchema } = require('../helpers/validations/common.schemas');

console.dir(
  numberSchema('test', 'body', {
    required: false,
    allowNull: true,
    minValue: 0,
    maxValue: 100,
    minLength: 3,
    maxLength: 10,
    minDecimal: 2,
    maxDecimal: 2,
  }),
  {
    depth: null,
  }
);
