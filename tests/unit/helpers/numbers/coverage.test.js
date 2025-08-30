// =============================================================================
// NUMBER HELPER - COVERAGE TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Number Helper Coverage Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('roundToDecimal: should return null for invalid decimals', () => {
    expect(numbersHelper.roundToDecimal(3.14, 'abc')).toBeNull();
    expect(cerror).toHaveBeenCalledWith('Round decimal', 'Invalid parameters provided');
  });

  test('calculatePercentage: should return null for invalid total', () => {
    expect(numbersHelper.calculatePercentage(50, 'abc')).toBeNull();
    expect(cerror).toHaveBeenCalledWith('Calculate percentage', 'Invalid parameters provided');
  });

  test('calculatePercentageValue: should return null for invalid total', () => {
    expect(numbersHelper.calculatePercentageValue(50, 'abc')).toBeNull();
    expect(cerror).toHaveBeenCalledWith('Calculate percentage value', 'Invalid parameters provided');
  });

  test('calculatePercentageChange: should return null for invalid newValue', () => {
    expect(numbersHelper.calculatePercentageChange(100, 'abc')).toBeNull();
    expect(cerror).toHaveBeenCalledWith('Calculate percentage change', 'Invalid parameters provided');
  });

  test('formatNumberToCurrency: should handle formatting errors', () => {
    expect(numbersHelper.formatNumberToCurrency(123, 'USD', 'invalid-locale')).toBeNull();
    expect(cerror).toHaveBeenCalledWith('Format currency', expect.stringContaining('Formatting error:'));
  });

  test('formatNumberWithCommas: should handle formatting errors', () => {
    expect(numbersHelper.formatNumberWithCommas(123, 'invalid-locale')).toBeNull();
    expect(cerror).toHaveBeenCalledWith('Format with commas', expect.stringContaining('Formatting error:'));
  });
});
